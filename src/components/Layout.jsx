import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { waLink } from '../lib/format.js';

function Header() {
  const { cart, isAdmin } = useStore();
  const n = cart.reduce((s, i) => s + i.qty, 0);
  return (
    <header className="top">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="Printly, ir al inicio"><img src="/img/logo.webp" alt="Printly" width="104" height="58" /></Link>
        <nav className="nav" aria-label="Principal">
          <NavLink to="/" end>Tienda</NavLink>
          <NavLink to="/mis-pedidos">Mis pedidos</NavLink>
          {isAdmin && <NavLink to="/admin">Administrar</NavLink>}
          <NavLink to="/carrito" className="cartbtn">Carrito <span className="badge num">{n}</span></NavLink>
        </nav>
      </div>
    </header>
  );
}

function Notice() {
  const { mode, dbError, authError } = useStore();
  if (mode === 'demo')
    return <div className="banner"><div className="wrap"><span className="dot" /><span><b>Versión demo.</b> Los pedidos y cambios se guardan solo en este navegador.</span></div></div>;
  if (dbError) return <div className="banner warnb"><div className="wrap"><span><b>No se pudo conectar con la tienda.</b> Recarga la página en unos minutos.</span></div></div>;
  if (authError) return <div className="banner warnb"><div className="wrap"><span><b>Los pedidos en línea no están disponibles por ahora.</b> Escríbenos por WhatsApp.</span></div></div>;
  return null;
}

function Footer() {
  const { settings: st } = useStore();
  const ig = (st.instagram || '').replace(/^@/, '');
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <img src="/img/logo.webp" alt="Printly" width="80" height="45" />
          <p>Estampados personalizados en playeras, sudaderas, tazas, termos, tarros y accesorios. Desde una pieza, con envíos a todo México.</p>
        </div>
        <div>
          <h4>Tienda</h4>
          <Link to="/#productos">Productos</Link>
          <Link to="/#galeria">Galería</Link>
          <Link to="/mis-pedidos">Mis pedidos</Link>
          <Link to="/carrito">Carrito</Link>
        </div>
        <div>
          <h4>Contacto</h4>
          {st.whatsapp && <a href={waLink(st.whatsapp, 'Hola, quiero información sobre un pedido.')} target="_blank" rel="noopener">WhatsApp {st.whatsapp}</a>}
          {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener">Instagram @{ig}</a>}
          {st.email && <a href={`mailto:${st.email}`}>{st.email}</a>}
          {st.city && <span>{st.city}</span>}
        </div>
        <div>
          <h4>Legal</h4>
          <Link to="/aviso-de-privacidad">Aviso de privacidad</Link>
          <Link to="/terminos">Términos, envíos y cambios</Link>
        </div>
      </div>
      <div className="wrap foot-legal">
        <span>© {new Date().getFullYear()} {st.shopName || 'Printly'}. Precios en MXN con IVA incluido.</span>
        <Link to="/admin" className="admin-link">Acceso administrador</Link>
      </div>
    </footer>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  const { settings: st } = useStore();
  return (
    <>
      <ScrollManager />
      <Header />
      <Notice />
      <main className="wrap" id="contenido"><Outlet /></main>
      <Footer />
      {st.whatsapp && (
        <a className="wa-float" href={waLink(st.whatsapp, 'Hola, quiero cotizar un pedido.')} target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.1c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.2 1.2-4-.3-.4a10.4 10.4 0 0 1-1.6-5.5C5.4 9.8 10.2 5 16 5s10.6 4.8 10.6 10.6S21.8 26 16 26zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>
        </a>
      )}
    </>
  );
}
