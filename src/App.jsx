import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { Loading } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import OrderPage from './pages/OrderPage.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Legal from './pages/Legal.jsx';
import NotFound from './pages/NotFound.jsx';

const Admin = lazy(() => import('./pages/admin/Admin.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="producto/:id" element={<Product />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="pedido/:id" element={<OrderPage />} />
        <Route path="mis-pedidos" element={<MyOrders />} />
        <Route path="aviso-de-privacidad" element={<Legal kind="privacidad" />} />
        <Route path="terminos" element={<Legal kind="terminos" />} />
        <Route path="admin/*" element={<Suspense fallback={<Loading />}><Admin /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
