import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { onlinePayAvailable, startOnlinePayment, subscribeOrder } from '../lib/db.js';
import { fmtDate, PAY, STATUSES, waLink } from '../lib/format.js';
import Mockup from '../components/Mockup.jsx';
import { Empty, Loading, Paw, Pill, useMoney, useTitle } from '../components/ui.jsx';

export function Track({ o }) {
  if (o.status === 'cancelado') return <Pill tone="bad">Cancelado</Pill>;
  const flow = STATUSES.slice(0, 6);
  const idx = flow.findIndex((s) => s[0] === o.status);
  return <div className="track">{flow.map((s, i) => <div key={s[0]} className={i <= idx ? 'on' : ''}><i />{s[1]}</div>)}</div>;
}

export function orderMessage(o, money) {
  return [
    `Hola, hice el pedido ${o.code} en la web.`,
    ...o.items.map((i) => `• ${i.name} x${i.qty} (${i.mat?.name || ''}, ${i.tech?.name || ''})`),
    `Total: ${money(o.total)}${o.payChoice === 'transferencia' ? ` · Anticipo: ${money(o.deposit)}` : ''}`,
    `Nombre: ${o.customer.name}`
  ].join('\n');
}

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user, settings: st, mode, toast } = useStore();
  const money = useMoney();
  const [o, setO] = useState(undefined);
  const [paying, setPaying] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  useEffect(() => { onlinePayAvailable().then(setMpReady); }, []);
  useTitle(o ? `Pedido ${o.code}` : 'Tu pedido');

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeOrder(id, setO, () => setO(null));
  }, [id, user?.uid]);

  if (o === undefined) return <Loading label="Buscando tu pedido…" />;
  if (!o) return <Empty title="No encontramos este pedido" action={<Link className="btn primary" to="/mis-pedidos">Ver mis pedidos</Link>}>Ábrelo desde el mismo navegador donde lo hiciste o escríbenos por WhatsApp con tu código.</Empty>;

  const pago = params.get('pago') || params.get('status');
  const paid = o.payStatus === 'pagado';
  const isNew = params.get('nuevo') === '1' || !!pago;

  async function payNow() {
    setPaying(true);
    try { window.location.assign(await startOnlinePayment(o.id)); }
    catch { setPaying(false); toast(mode === 'demo' ? 'El pago en línea no está disponible en la demo.' : 'No se pudo abrir Mercado Pago. Inténtalo de nuevo o paga por transferencia.'); }
  }

  return (
    <div className="order-page">
      <div className="success">
        <Paw />
        <div className="eyebrow">{paid ? 'Pago recibido' : isNew ? 'Pedido recibido' : 'Seguimiento de pedido'}</div>
        <h1 className="page-title">{isNew ? `¡Gracias, ${o.customer.name.split(' ')[0]}!` : `Pedido ${o.code}`}</h1>
        {isNew && <><p className="muted">Tu código de pedido es</p><div className="code big">{o.code}</div></>}
      </div>

      {pago === 'aprobado' || pago === 'approved' ? <div className="alert ok">Mercado Pago aprobó tu pago. En unos segundos se verá reflejado aquí.</div> : null}
      {pago === 'pendiente' || pago === 'pending' || pago === 'in_process' ? <div className="alert warn">Tu pago está pendiente. Si elegiste OXXO, paga en tienda con la referencia que te dio Mercado Pago.</div> : null}
      {pago === 'rechazado' || pago === 'failure' || pago === 'rejected' ? <div className="alert bad">El pago no se completó. Puedes intentarlo otra vez con otro método.</div> : null}
      {pago === 'error' ? <div className="alert bad">Tu pedido quedó registrado, pero no pudimos abrir Mercado Pago. Inténtalo otra vez o elige transferencia.</div> : null}

      <div className="two">
        <div className="ocard">
          <div className="ohead">
            <div><div className="code">{o.code}</div><span className="muted small">Pedido el {fmtDate(o.createdAt)} · Entrega estimada {fmtDate(o.dueDate + 'T12:00')}</span></div>
            <Pill tone={(PAY[o.payStatus] || PAY.pendiente)[1]}>{(PAY[o.payStatus] || PAY.pendiente)[0]}</Pill>
          </div>
          <Track o={o} />
          {o.items.map((i, k) => (
            <div className="citem" key={k}>
              <div className="mini"><Mockup item={i} /></div>
              <div className="cbody"><h3>{i.name} ×{i.qty}</h3><div className="d"><span>{i.mat?.name} · {i.tech?.name}{i.color ? ` · ${i.color.name}` : ''}</span>{i.sizes && <span>Tallas: {Object.entries(i.sizes).map(([s, n]) => `${s}×${n}`).join(' · ')}</span>}</div></div>
              <div className="num cprice">{money(i.line)}</div>
            </div>
          ))}
          <div className="sumbox">
            <div className="line total"><span>Total</span><span className="num">{money(o.total)}</span></div>
            <div className="line"><span>Pagado</span><span className="num">{money(o.paid || 0)}</span></div>
            {o.total - (o.paid || 0) > 0.01 && <div className="line strong"><span>Saldo</span><span className="num">{money(o.total - (o.paid || 0))}</span></div>}
          </div>
        </div>

        <div className="paybox">
          {paid ? (
            <><h3>Todo listo</h3><p>Recibimos tu pago. Te escribiremos por WhatsApp para enviarte el arte final y avisarte cuando esté listo.</p></>
          ) : o.payChoice === 'online' && mpReady ? (
            <>
              <h3>Paga en línea</h3>
              <p>Paga {money(o.total)} con tarjeta, OXXO o saldo de Mercado Pago. Tu pedido entra a producción en cuanto se acredite.</p>
              <button className="btn primary block lg" onClick={payNow} disabled={paying}>{paying ? 'Abriendo Mercado Pago…' : `Pagar ${money(o.total)}`}</button>
            </>
          ) : (
            <>
              <h3>Confirma con tu anticipo</h3>
              <p>Envía <b>{money(o.deposit)}</b> por {o.payMethod}{st.payNumber ? <> a la cuenta <b className="num">{st.payNumber}</b></> : ''}{st.payHolder ? ` a nombre de ${st.payHolder}` : ''}.</p>
              <p className="muted small">Saldo al entregar: {money(o.total - o.deposit)}</p>
            </>
          )}
          {st.whatsapp ? (
            <a className="btn block" href={waLink(st.whatsapp, orderMessage(o, money))} target="_blank" rel="noopener">Enviar pedido por WhatsApp</a>
          ) : <p className="muted small">Te escribiremos por WhatsApp al {o.customer.phone} para coordinar.</p>}
          <Link className="btn ghost block" to="/mis-pedidos">Ver todos mis pedidos</Link>
        </div>
      </div>
    </div>
  );
}
