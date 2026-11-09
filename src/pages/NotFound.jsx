import { Link } from 'react-router-dom';
import { Empty, useTitle } from '../components/ui.jsx';
export default function NotFound() {
  useTitle('Página no encontrada');
  return <Empty title="Esta página no existe" action={<Link className="btn primary" to="/">Ir a la tienda</Link>}>Revisa la dirección o vuelve al inicio.</Empty>;
}
