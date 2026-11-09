// Webhook de Mercado Pago: confirma pagos y actualiza el pedido en Firestore.
// Configúralo en Mercado Pago → Tus integraciones → Webhooks, evento "Pagos",
// con la URL https://TU-DOMINIO/.netlify/functions/mp-webhook
import crypto from 'node:crypto';
import { getDb, json } from './_lib/admin.js';

function validSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin clave configurada no se valida (recomendado configurarla)
  const sig = req.headers.get('x-signature') || '';
  const reqId = req.headers.get('x-request-id') || '';
  const parts = Object.fromEntries(sig.split(',').map((p) => p.trim().split('=')));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${parts.ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(parts.v1)); } catch { return false; }
}

export default async (req) => {
  if (req.method !== 'POST') return json(200, { ok: true });
  const url = new URL(req.url);
  let body = {};
  try { body = await req.json(); } catch { /* algunos avisos llegan sin cuerpo */ }
  const type = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const dataId = url.searchParams.get('data.id') || body.data?.id || url.searchParams.get('id');
  if (type !== 'payment' || !dataId) return json(200, { ignored: true });
  if (!validSignature(req, dataId)) return json(401, { error: 'Firma inválida' });

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json(503, { error: 'Sin configuración' });
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return json(200, { ignored: 'payment not found' });
    const pay = await res.json();
    const orderId = pay.external_reference;
    if (!orderId) return json(200, { ignored: 'no reference' });

    const db = getDb();
    const ref = db.collection('pedidos').doc(orderId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const o = snap.data();
      const patch = { mp: { ...(o.mp || {}), paymentId: String(pay.id), status: pay.status, statusDetail: pay.status_detail, amount: pay.transaction_amount, updatedAt: Date.now() } };
      if (pay.status === 'approved') {
        patch.paid = Math.min(o.total, Number(pay.transaction_amount) || o.total);
        patch.payStatus = patch.paid >= o.total - 0.01 ? 'pagado' : 'anticipo';
        if (o.payStatus !== 'pagado') patch.history = [...(o.history || []), { status: o.status, at: Date.now(), note: 'Pago aprobado en Mercado Pago' }];
      } else if (pay.status === 'refunded' || pay.status === 'charged_back') {
        patch.payStatus = 'reembolsado'; patch.paid = 0;
      }
      tx.update(ref, patch);
    });
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Error al procesar' });
  }
};
