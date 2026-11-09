// POST /api/paypal-capture  { orderId, paypalOrderId }
// Cobra la orden aprobada por el cliente, verifica el monto y marca el pedido como pagado.
import { getDb, json } from './_lib/admin.js';
import { paypal, paypalConfigured } from './_lib/paypal.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  if (!paypalConfigured()) return json(503, { error: 'PayPal no está configurado.' });
  let orderId, paypalOrderId;
  try { ({ orderId, paypalOrderId } = await req.json()); } catch { return json(400, { error: 'Solicitud inválida' }); }
  if (!orderId || !paypalOrderId || typeof orderId !== 'string' || typeof paypalOrderId !== 'string') return json(400, { error: 'Datos incompletos' });

  try {
    const db = getDb();
    const ref = db.collection('pedidos').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return json(404, { error: 'Pedido no encontrado' });
    const order = snap.data();
    if (order.paypal?.orderId !== paypalOrderId) return json(400, { error: 'El pago no corresponde a este pedido' });
    if (order.payStatus === 'pagado') return json(200, { ok: true, already: true });

    let r = await paypal(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, { method: 'POST', idempotencyKey: `cap-${paypalOrderId}` });
    if (!r.ok && r.data?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED') r = await paypal(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
    if (!r.ok) {
      console.error('PayPal capture', r.status, JSON.stringify(r.data));
      const issue = r.data?.details?.[0]?.issue;
      return json(402, { error: issue === 'INSTRUMENT_DECLINED' ? 'PayPal rechazó el método de pago. Prueba con otro.' : 'No se pudo completar el pago.', retry: issue === 'INSTRUMENT_DECLINED' });
    }

    const pu = r.data.purchase_units?.[0] || {};
    const cap = pu.payments?.captures?.[0];
    const amount = Number(cap?.amount?.value || 0);
    const okRef = (pu.custom_id || pu.reference_id || cap?.custom_id) === orderId || order.paypal?.orderId === r.data.id;
    const expected = Number(order.paypal?.serverTotal || order.total);
    const completed = r.data.status === 'COMPLETED' && cap?.status === 'COMPLETED' && cap?.amount?.currency_code === 'MXN';

    const patch = { paypal: { ...(order.paypal || {}), captureId: cap?.id || null, status: cap?.status || r.data.status, amount, payer: r.data.payer?.email_address || null, updatedAt: Date.now() } };
    if (completed && okRef && amount >= expected - 0.01) {
      Object.assign(patch, { paid: Math.min(order.total, amount), payStatus: 'pagado',
        history: [...(order.history || []), { status: order.status, at: Date.now(), note: 'Pago aprobado en PayPal' }] });
    } else if (cap?.status === 'PENDING') {
      patch.paypal.pending = cap?.status_details?.reason || 'PENDING';
    }
    await ref.update(patch);
    return json(200, { ok: true, status: cap?.status || r.data.status, paid: patch.payStatus === 'pagado' });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Error al confirmar el pago.' });
  }
};
