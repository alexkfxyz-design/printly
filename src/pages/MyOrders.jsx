import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { subscribeMyOrders } from '../lib/db.js';
import { fmtDate, PAY } from '../lib/format.js';
import Mockup from '../components/Mockup.jsx';
import { Empty, Loading, Pill, useMoney, useTitle } from '../components/ui.jsx';
import { Track } from './OrderPage.jsx';

export default function MyOrders() {
  useTitle('Mis pedidos');
  const { user } = useStore();
  const money = useMoney();
  const [list, setList] = useState(null);
  useEffect(() => { if (!user?.uid) return; return subscribeMyOrders(user.uid, setList); }, [user?.uid]);

  if (!list) return <Loading />;
  if (!list.length) return <Empty title="Aún no tienes pedidos" action={<Link className="btn primary" to="/#productos">Empezar a diseñar</Link>}>Cuando hagas uno, aquí verás en qué etapa va. Los pedidos se guardan en este navegador.</Empty>;
  return (
    <>
      <h1 className="page-title">Mis pedidos</h1>
      <div className="stack">
        {list.map((o) => (
          <Link to={`/pedido/${o.id}`} className="ocard link" key={o.id}>
            <div className="ohead">
              <div><div className="code">{o.code}</div><span className="muted small">Pedido el {fmtDate(o.createdAt)} · Entrega estimada {fmtDate(o.dueDate + 'T12:00')}</span></div>
              <Pill tone={(PAY[o.payStatus] || PAY.pendiente)[1]}>{(PAY[o.payStatus] || PAY.pendiente)[0]}</Pill>
            </div>
            <Track o={o} />
            <div className="thumbs-row">{o.items.map((i, k) => <div key={k} className="tmini"><Mockup item={i} /></div>)}</div>
            <div className="line"><span className="muted">{o.items.length} producto{o.items.length === 1 ? '' : 's'} · {o.items.reduce((s, i) => s + i.qty, 0)} piezas</span><span className="num"><b>{money(o.total)}</b></span></div>
          </Link>
        ))}
      </div>
    </>
  );
}
