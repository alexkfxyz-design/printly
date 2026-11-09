// GET /api/pay-status → indica si el pago en línea (Mercado Pago) está configurado en Netlify.
export default async () =>
  new Response(JSON.stringify({ online: Boolean(process.env.MP_ACCESS_TOKEN && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
  });
