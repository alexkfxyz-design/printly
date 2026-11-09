// POST /api/paypal-create-order  { orderId }
// Recalcula el total en el servidor y crea la orden de PayPal (MXN).
import { getDb, loadCatalog, json } from './_lib/admin.js';
import { paypal, paypalConfigured } from './_lib/paypal.js';
import { recomputeOrder } from '../../src/lib/pricing.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  if (!paypalConfigured()) return json(503, { error: 'PayPal no está configurado.' });
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
    if (catalog.settings?.paypalPay === false) return json(400, { error: 'El pago con PayPal está desactivado.' });
    const server = recomputeOrder(catalog, order);
    if (!(server.total > 0)) return json(400, { error: 'Total inválido' });
    const value = server.total.toFixed(2);

    const r = await paypal('/v2/checkout/orders', {
      method: 'POST', idempotencyKey: `${orderId}-${value}`,
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId, custom_id: orderId, invoice_id: `${order.code}-${Date.now().toString(36)}`,
          description: `Pedido ${order.code} · ${catalog.settings?.shopName || 'Printly'}`.slice(0, 127),
          amount: { currency_code: 'MXN', value }
        }],
        application_context: { brand_name: (catalog.settings?.shopName || 'Printly').slice(0, 127), shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW', locale: 'es-MX' }
      }
    });
    if (!r.ok) { console.error('PayPal create', r.status, JSON.stringify(r.data)); return json(502, { error: 'PayPal no respondió. Intenta de nuevo.' }); }

    const patch = { paypal: { ...(order.paypal || {}), orderId: r.data.id, serverTotal: server.total } };
    if (Math.abs(server.total - order.total) > 0.5)
      Object.assign(patch, { total: server.total, sub: server.sub, disc: server.disc, rushFee: server.rush, ship: server.ship, deposit: server.deposit, priceAdjusted: true });
    await ref.update(patch);
    return json(200, { id: r.data.id });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'No se pudo preparar el pago.' });
  }
};
