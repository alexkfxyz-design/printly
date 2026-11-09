/**
 * Capa de datos. Con Firebase configurado usa Firestore + Authentication.
 * Sin configurar funciona en MODO DEMO: todo se guarda en el navegador (localStorage),
 * útil para mostrar la tienda antes de conectar la base de datos.
 *
 * Firestore:
 *   config/tienda      ajustes, categorías, colores, tallas, materiales y técnicas
 *   productos/{id}     un documento por producto
 *   pedidos/{id}       un documento por pedido (con los diseños comprimidos)
 */
import {
  doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, query, where, orderBy, limit
} from 'firebase/firestore';
import {
  onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db, firebaseEnabled, ADMIN_EMAILS } from '../firebase.js';
import { CATALOGO_INICIAL } from '../data/catalogoInicial.js';
import { clone, lsGet, lsSet } from './format.js';
import { approxBytes } from './image.js';

export const MODE = firebaseEnabled ? 'live' : 'demo';

/* ---------------- demo backend (localStorage + eventos) ---------------- */
const DEMO = { cat: 'printly_demo_catalog_v1', orders: 'printly_demo_orders_v1' };
const bus = new EventTarget();
const emit = (t) => bus.dispatchEvent(new Event(t));
const on = (t, fn) => { bus.addEventListener(t, fn); return () => bus.removeEventListener(t, fn); };
const demoOrders = () => lsGet(DEMO.orders, []);
const saveDemoOrders = (list) => { if (!lsSet(DEMO.orders, list)) throw Object.assign(new Error('storage'), { code: 'storage' }); emit('orders'); };
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === DEMO.orders) emit('orders'); if (e.key === DEMO.cat) emit('catalog'); });

/* ---------------- auth ---------------- */
const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export function watchAuth(cb) {
  if (MODE === 'demo') { cb({ uid: 'demo', email: 'demo', isAnonymous: false, isAdmin: true }); return () => {}; }
  return onAuthStateChanged(auth, async (u) => {
    if (!u) {
      cb(null);
      try { await signInAnonymously(auth); } catch (e) { console.error(e); cb({ error: e.code || 'auth' }); }
      return;
    }
    cb({ uid: u.uid, email: u.email, isAnonymous: u.isAnonymous, isAdmin: !u.isAnonymous && isAdminEmail(u.email) });
  });
}

export async function adminSignIn(email, password) {
  if (MODE === 'demo') return;
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (!isAdminEmail(cred.user.email)) {
    await signOut(auth);
    throw Object.assign(new Error('not-admin'), { code: 'not-admin' });
  }
}
export const adminSignOut = () => (MODE === 'demo' ? Promise.resolve() : signOut(auth));
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

export const AUTH_ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'Escribe un correo válido.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  'not-admin': 'Esta cuenta no tiene acceso al panel.'
};

/* ---------------- catálogo ---------------- */
export function subscribeCatalog(cb, onError) {
  if (MODE === 'demo') {
    const push = () => cb({ catalog: lsGet(DEMO.cat, null) || clone(CATALOGO_INICIAL), seeded: true });
    push();
    return on('catalog', push);
  }
  const L = { cfg: undefined, prods: undefined };
  const send = () => {
    if (L.cfg === undefined || L.prods === undefined) return;
    if (!L.cfg) return cb({ catalog: clone(CATALOGO_INICIAL), seeded: false });
    cb({ catalog: { ...L.cfg, products: [...L.prods].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)) }, seeded: true });
  };
  const u1 = onSnapshot(doc(db, 'config', 'tienda'), (s) => { L.cfg = s.exists() ? s.data() : null; send(); }, onError);
  const u2 = onSnapshot(collection(db, 'productos'), (s) => { L.prods = s.docs.map((d) => ({ ...d.data(), id: d.id })); send(); }, onError);
  return () => { u1(); u2(); };
}

/** Guarda el catálogo completo. `prev` sirve para borrar productos eliminados. */
export async function saveCatalog(catalog, prev) {
  const { products, ...cfg } = clone(catalog);
  if (MODE === 'demo') {
    if (!lsSet(DEMO.cat, catalog)) throw Object.assign(new Error('storage'), { code: 'storage' });
    emit('catalog');
    return;
  }
  const big = products.find((p) => approxBytes(p) > 900_000);
  if (big) throw Object.assign(new Error('big'), { code: 'big', product: big.name });
  const batch = writeBatch(db);
  batch.set(doc(db, 'config', 'tienda'), cfg);
  products.forEach((p, i) => batch.set(doc(db, 'productos', p.id), { ...p, orden: i }));
  (prev?.products || []).filter((p) => !products.some((x) => x.id === p.id)).forEach((p) => batch.delete(doc(db, 'productos', p.id)));
  await batch.commit();
}

export function resetDemo() {
  try { localStorage.removeItem(DEMO.cat); localStorage.removeItem(DEMO.orders); } catch { /* ignore */ }
  emit('catalog'); emit('orders');
}

/* ---------------- pedidos ---------------- */
export async function createOrder(order) {
  if (approxBytes(order) > 950_000) throw Object.assign(new Error('size'), { code: 'size' });
  if (MODE === 'demo') { saveDemoOrders([order, ...demoOrders()]); return; }
  await setDoc(doc(db, 'pedidos', order.id), order);
}

const sortDesc = (list) => list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

export function subscribeMyOrders(uid, cb) {
  if (MODE === 'demo') { const push = () => cb(sortDesc(demoOrders())); push(); return on('orders', push); }
  return onSnapshot(query(collection(db, 'pedidos'), where('uid', '==', uid)),
    (s) => cb(sortDesc(s.docs.map((d) => ({ ...d.data(), id: d.id })))), (e) => console.error(e));
}

export function subscribeOrder(id, cb, onError) {
  if (MODE === 'demo') { const push = () => cb(demoOrders().find((o) => o.id === id) || null); push(); return on('orders', push); }
  return onSnapshot(doc(db, 'pedidos', id), (s) => cb(s.exists() ? { ...s.data(), id: s.id } : null), onError);
}

export function subscribeAllOrders(cb, onError) {
  if (MODE === 'demo') { const push = () => cb(sortDesc(demoOrders())); push(); return on('orders', push); }
  return onSnapshot(query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'), limit(1000)),
    (s) => cb(s.docs.map((d) => ({ ...d.data(), id: d.id }))), onError);
}

export async function updateOrder(id, patch) {
  if (MODE === 'demo') { saveDemoOrders(demoOrders().map((o) => (o.id === id ? { ...o, ...patch } : o))); return; }
  await updateDoc(doc(db, 'pedidos', id), patch);
}

export async function deleteOrder(id) {
  if (MODE === 'demo') { saveDemoOrders(demoOrders().filter((o) => o.id !== id)); return; }
  await deleteDoc(doc(db, 'pedidos', id));
}

/* ---------------- Mercado Pago ---------------- */
export async function startOnlinePayment(orderId) {
  if (MODE === 'demo') throw Object.assign(new Error('demo'), { code: 'demo' });
  const res = await fetch('/api/create-preference', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw Object.assign(new Error(data.error || 'mp'), { code: 'mp', detail: data.error });
  return data.url;
}
