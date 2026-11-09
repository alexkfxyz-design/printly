// GET /api/pay-status → qué pagos en línea están configurados en Netlify.
import { paypalConfigured } from './_lib/paypal.js';

export default async () => {
  const fb = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
  const body = {
    mercadopago: fb && Boolean(process.env.MP_ACCESS_TOKEN),
    paypal: fb && paypalConfigured(),
    paypalClientId: paypalConfigured() ? process.env.PAYPAL_CLIENT_ID : null
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
};
