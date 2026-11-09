import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useStore } from '../../context/StoreContext.jsx';
import { adminSignIn, adminSignOut, AUTH_ERRORS, resetPassword, saveCatalog } from '../../lib/db.js';
import { CATALOGO_INICIAL } from '../../data/catalogoInicial.js';
import { clone } from '../../lib/format.js';
import { Loading, Pill, useTitle } from '../../components/ui.jsx';
import Orders from './Orders.jsx';
import Products from './Products.jsx';
import { Materials, Techniques, Lists } from './CatalogEditors.jsx';
import Settings from './Settings.jsx';

/** Guarda el catálogo y muestra el resultado. Devuelve true si se guardó. */
export function useSaveCatalog() {
  const { catalog, toast } = useStore();
  return async (next, okMsg = 'Cambios guardados') => {
    try { await saveCatalog(next, catalog); toast(okMsg); return true; }
    catch (e) {
      console.error(e);
      toast(e.code === 'big' ? `"${e.product}" tiene demasiadas fotos subidas. Quita alguna.`
        : e.code === 'permission-denied' ? 'Tu cuenta no tiene permiso para guardar. Revisa el correo en las reglas de Firestore.'
        : e.code === 'storage' ? 'El navegador no tiene espacio para guardar.' : 'No se pudo guardar. Revisa tu conexión.');
      return false;
    }
  };
}

function Login() {
  useTitle('Acceso administrador');
  const { toast } = useStore();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await adminSignIn(email, pass); }
    catch (e2) { setErr(AUTH_ERRORS[e2.code] || 'No se pudo iniciar sesión.'); setBusy(false); }
  }
  async function forgot() {
    if (!email) return setErr('Escribe tu correo y vuelve a tocar "Olvidé mi contraseña".');
    try { await resetPassword(email); toast('Te enviamos un correo para cambiar tu contraseña.'); } catch { setErr('No se pudo enviar el correo. Revisa la dirección.'); }
  }
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <img src="/img/logo.webp" alt="Printly" width="120" height="67" />
        <h1 className="page-title">Panel de administración</h1>
        <label className="f">Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label className="f">Contraseña<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <button type="button" className="btn ghost sm" onClick={forgot}>Olvidé mi contraseña</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { user, isAdmin, catalog, seeded, mode, settings } = useStore();
  const save = useSaveCatalog();
  useTitle('Administrar');
  if (user === undefined || !catalog) return <Loading />;
  if (!isAdmin) return <Login />;
  const tabs = [['', 'Pedidos'], ['productos', 'Productos'], ['materiales', 'Materiales'], ['tecnicas', 'Técnicas'], ['catalogo', 'Categorías y colores'], ['ajustes', 'Ajustes']];
  return (
    <div className="admin">
      <div className="adm-head">
        <div><div className="eyebrow">Panel de administración</div><h1 className="page-title">{settings.shopName}</h1></div>
        {mode === 'live'
          ? <div className="session"><span className="muted">{user.email}</span><button className="btn sm" onClick={() => adminSignOut()}>Cerrar sesión</button></div>
          : <Pill tone="info">Modo demo: sin base de datos</Pill>}
      </div>
      {!seeded && (
        <div className="alert warn row-between">
          <span><b>El catálogo aún no está en la base de datos.</b> Los clientes ven el catálogo inicial.</span>
          <button className="btn sm primary" onClick={() => save(clone(CATALOGO_INICIAL), 'Catálogo publicado')}>Publicar catálogo inicial</button>
        </div>
      )}
      <nav className="tabs" aria-label="Secciones del panel">
        {tabs.map(([k, l]) => <NavLink key={k} to={`/admin${k ? '/' + k : ''}`} end>{l}</NavLink>)}
      </nav>
      <Routes>
        <Route index element={<Orders />} />
        <Route path="productos" element={<Products />} />
        <Route path="materiales" element={<Materials />} />
        <Route path="tecnicas" element={<Techniques />} />
        <Route path="catalogo" element={<Lists />} />
        <Route path="ajustes" element={<Settings />} />
      </Routes>
    </div>
  );
}
