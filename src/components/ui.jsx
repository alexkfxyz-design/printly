import { useEffect, useState } from 'react';
import { PAW_SVG } from '../lib/mockup.js';
import { useStore } from '../context/StoreContext.jsx';
import { money as fmtMoney } from '../lib/format.js';

export const Pill = ({ tone = 'muted', children }) => <span className={`pill t-${tone}`}>{children}</span>;

export const Paw = () => <span className="paw-wrap" dangerouslySetInnerHTML={{ __html: PAW_SVG }} />;

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <Paw />
      {title && <h2>{title}</h2>}
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Cargando…' }) {
  return <div className="empty"><Paw /><p className="muted">{label}</p></div>;
}

export function Modal({ title, eyebrow, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 style={{ marginTop: 6 }}>{title}</h2></div>
          <button className="btn sm" onClick={onClose}>Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Precio con la moneda de la tienda. */
export function useMoney() {
  const { cur } = useStore();
  return (n) => fmtMoney(n, cur);
}

export function useTitle(title) {
  useEffect(() => { document.title = title ? `${title} · Printly` : 'Printly · Estampados personalizados en México'; }, [title]);
}

/** Botón que pide un segundo clic para confirmar (sin diálogos del navegador). */
export function ConfirmButton({ onConfirm, children, confirmLabel = '¿Seguro? Toca otra vez', className = 'btn sm ghost danger', ...rest }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" className={`${className} ${armed ? 'armed' : ''}`} {...rest}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirmLabel : children}
    </button>
  );
}
