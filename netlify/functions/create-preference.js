// POST /api/create-preference  { orderId }
// Recalcula el total del pedido en el servidor y crea un link de pago de Mercado Pago.
import { getDb, loadCatalog, json, siteUrl } from './_lib/admin.js';
import { recomputeOrder } from '../../src/lib/pricing.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json(503, { error: 'El pago en línea no está configurado.' });

  let orderId;
  try { ({ orderId } = await req.json()); } catch { return json(400, { error: 'Solicitud inválida' }); }
  if (!orderId || typeof orderId !== 'string' || orderId.length > 64) return json(400, { error: 'Pedido inválido' });

  try {
    const db = getDb();
    const ref = db.collection('pedidos').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return json(404, { error: 'Pedido no encontrado' });
    const order = snap.data();
    if (order.payStatus === 'pagado') return json(409, { error: 'Este pedido ya está pagado' });
    if (order.status === 'cancelado') return json(409, { error: 'Este pedido está cancelado' });

    const catalog = await loadCatalog(db);
    if (catalog.settings?.onlinePay === false) return json(400, { error: 'El pago en línea está desactivado.' });
    const server = recomputeOrder(catalog, order);
    if (!(server.total > 0)) return json(400, { error: 'Total inválido' });

    const site = siteUrl();
    const back = (s) => `${site}/pedido/${orderId}?pago=${s}`;
    const pref = {
      items: [{
        id: order.code, title: `Pedido ${order.code} · ${catalog.settings?.shopName || 'Printly'}`,
        description: order.items.map((i) => `${i.name} x${i.qty}`).join(', ').slice(0, 250),
        quantity: 1, unit_price: server.total, currency_id: 'MXN'
      }],
      payer: { name: order.customer?.name, ...(order.customer?.email ? { email: order.customer.email } : {}) },
      external_reference: orderId,
      metadata: { order_id: orderId, code: order.code },
      back_urls: { success: back('aprobado'), pending: back('pendiente'), failure: back('rechazado') },
      auto_return: 'approved',
      notification_url: `${site}/.netlify/functions/mp-webhook`,
      statement_descriptor: (catalog.settings?.shopName || 'PRINTLY').toUpperCase().slice(0, 22)
    };
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `${orderId}-${server.total}` },
      body: JSON.stringify(pref)
    });
    const data = await res.json();
    if (!res.ok) { console.error('MP error', data); return json(502, { error: 'Mercado Pago no respondió. Intenta de nuevo.' }); }

    const patch = { mp: { ...(order.mp || {}), preferenceId: data.id, serverTotal: server.total } };
    if (Math.abs(server.total - order.total) > 0.5) {
      // El total enviado por el navegador no coincide: se guarda el del servidor.
      Object.assign(patch, { total: server.total, sub: server.sub, disc: server.disc, rushFee: server.rush, ship: server.ship, deposit: server.deposit, priceAdjusted: true });
    }
    await ref.update(patch);
    return json(200, { url: data.init_point });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'No se pudo preparar el pago.' });
  }
};
