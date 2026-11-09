import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const env = import.meta.env;

// Configuración web de Firebase. No es secreta (Firebase la necesita en el navegador);
// la seguridad la dan las reglas de Firestore. Las variables VITE_ de Netlify o del .env, si existen, tienen prioridad.
const DEFAULTS = {
  apiKey: 'AIzaSyB7QXCjrYSU6H97axrOGzNYTnk1U693kKk',
  authDomain: 'printly-store.firebaseapp.com',
  projectId: 'printly-store',
  storageBucket: 'printly-store.firebasestorage.app',
  messagingSenderId: '299358211181',
  appId: '1:299358211181:web:f91f7a51e683446ff10364',
  adminEmails: 'psic.eliamgarcia@gmail.com'
};
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULTS.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULTS.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULTS.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULTS.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULTS.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULTS.appId
};

export const firebaseEnabled = env.VITE_DEMO !== 'true' && Boolean(cfg.apiKey && cfg.projectId);

export const ADMIN_EMAILS = String(env.VITE_ADMIN_EMAILS || DEFAULTS.adminEmails)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const SITE_URL = (env.VITE_SITE_URL || (typeof location !== 'undefined' ? location.origin : '')).replace(/\/$/, '');

let app = null, auth = null, db = null;

if (firebaseEnabled) {
  app = initializeApp(cfg);
  auth = getAuth(app);
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = initializeFirestore(app, {});
  }
}

export { app, auth, db };
