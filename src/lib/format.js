export const money = (n, cur = '$') =>
  `${cur}${cur.length > 1 ? ' ' : ''}${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (t) => (t ? new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—');
export const fmtLongDate = (t) => (t ? new Date(t).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : '—');
export const fmtDateTime = (t) =>
  t ? new Date(t).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const rid = () => Math.random().toString(36).slice(2, 10);
export const clone = (o) => JSON.parse(JSON.stringify(o));

export const slug = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || rid();

export function uniqueId(arr, base) {
  let id = slug(base), n = 2;
  while (arr.some((x) => x.id === id)) id = `${slug(base)}-${n++}`;
  return id;
}

export function orderCode() {
  const d = new Date();
  return `PR-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Enlace de WhatsApp a un número mexicano de 10 dígitos (o con lada internacional). */
export function waLink(phone, text) {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  const num = d.length === 10 ? `52${d}` : d;
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const STATUSES = [
  ['recibido', 'Recibido', 'info'],
  ['revision', 'Diseño en revisión', 'warn'],
  ['aprobado', 'Aprobado', 'info'],
  ['produccion', 'En producción', 'accent'],
  ['listo', 'Listo para entregar', 'ok'],
  ['entregado', 'Entregado', 'muted'],
  ['cancelado', 'Cancelado', 'bad']
];
export const statusMeta = (k) => STATUSES.find((s) => s[0] === k) || STATUSES[0];
export const PAY = {
  pendiente: ['Pago pendiente', 'warn'],
  anticipo: ['Anticipo recibido', 'info'],
  pagado: ['Pagado', 'ok'],
  reembolsado: ['Reembolsado', 'muted']
};
