// Cliente mínimo de la API REST de PayPal (Orders v2).
const BASE = () => (process.env.PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');

export const paypalConfigured = () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

async function token() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE()}/v1/oauth2/token`, {
    method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth: ${data.error_description || res.status}`);
  return data.access_token;
}

export async function paypal(path, { method = 'GET', body, idempotencyKey } = {}) {
  const res = await fetch(`${BASE()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'PayPal-Request-Id': idempotencyKey } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
