import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MODE, subscribeCatalog, watchAuth } from '../lib/db.js';
import { lsGet, lsSet } from '../lib/format.js';

const StoreCtx = createContext(null);
const CART_KEY = 'printly_cart_v1';

export function StoreProvider({ children }) {
  const [catalog, setCatalog] = useState(null);
  const [seeded, setSeeded] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [user, setUser] = useState(undefined); // undefined = cargando, null = sin sesión
  const [authError, setAuthError] = useState(null);
  const [cart, setCart] = useState(() => lsGet(CART_KEY, []));
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => subscribeCatalog(
    ({ catalog: c, seeded: s }) => { setCatalog(c); setSeeded(s); setDbError(null); },
    (e) => { console.error(e); setDbError(e.code || 'error'); }
  ), []);

  useEffect(() => watchAuth((u) => {
    if (u?.error) { setAuthError(u.error); setUser(null); return; }
    setAuthError(null); setUser(u);
  }), []);

  useEffect(() => {
    if (!lsSet(CART_KEY, cart) && cart.length) {
      // El navegador no tiene espacio (imágenes grandes): el carrito sigue en memoria.
    }
  }, [cart]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }, []);

  const addToCart = useCallback((item) => setCart((c) => {
    const i = c.findIndex((x) => x.key === item.key);
    if (i < 0) return [...c, item];
    const n = [...c]; n[i] = item; return n;
  }), []);
  const removeFromCart = useCallback((key) => setCart((c) => c.filter((x) => x.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo(() => ({
    mode: MODE, catalog, seeded, dbError, user, authError,
    isAdmin: !!user?.isAdmin, settings: catalog?.settings || {}, cur: catalog?.settings?.currency || '$',
    cart, addToCart, removeFromCart, clearCart, toast
  }), [catalog, seeded, dbError, user, authError, cart, addToCart, removeFromCart, clearCart, toast]);

  return (
    <StoreCtx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
