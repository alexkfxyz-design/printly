// Inicializa Firebase Admin con la cuenta de servicio guardada en Netlify.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!raw) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_BASE64 en Netlify.');
    const sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

/** Lee el catálogo completo (ajustes + productos) desde Firestore. */
export async function loadCatalog(db) {
  const [cfg, prods] = await Promise.all([db.doc('config/tienda').get(), db.collection('productos').get()]);
  if (!cfg.exists) throw new Error('El catálogo no está publicado en Firestore.');
  return { ...cfg.data(), products: prods.docs.map((d) => ({ ...d.data(), id: d.id })) };
}

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const siteUrl = () => (process.env.VITE_SITE_URL || process.env.URL || '').replace(/\/$/, '');
