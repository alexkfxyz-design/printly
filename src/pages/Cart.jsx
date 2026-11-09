import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { addBusinessDays, orderTotals } from '../lib/pricing.js';
import { createOrder, getPayConfig, startOnlinePayment } from '../lib/db.js';
import { fmtLongDate, orderCode } from '../lib/format.js';
import Mockup from '../components/Mockup.jsx';
import { Empty, Loading, useMoney, useTitle } from '../components/ui.jsx';

const newId = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36));

export default function Cart() {
  useTitle('Tu pedido');
  const { catalog, settings: st, cart, removeFromCart, clearCart, user, mode, authError } = useStore();
  const money = useMoney();
  const nav = useNavigate();
  const [delivery, setDelivery] = useState('recoger');
  const [rush, setRush] = useState(false);
  const [pc, setPc] = useState({ mercadopago: false, paypal: false });
  useEffect(() => { getPayConfig().then(setPc); }, []);
  const canMp = st.onlinePay !== false && pc.mercadopago;
  const canPaypal = st.paypalPay !== false && (pc.paypal || !!st.paypalMe);
  const canCash = st.cashPay !== false && delivery === 'recoger';
  const canTransfer = st.transferPay !== false || (!canMp && !canPaypal && !canCash);
  const [payChoice, setPayChoice] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', payMethod: '', notes: '', accept: false });
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  if (!catalog) return <Loading />;
  if (!cart.length)
    return <Empty title="Tu carrito está vacío" action={<Link className="btn primary" to="/#productos">Ver productos</Link>}>Elige un producto y personalízalo.</Empty>;

  const t = orderTotals(cart, st, { rush, delivery });
  const ready = addBusinessDays(new Date(), rush ? Number(st.rushDays) : Number(st.normalDays));
  const avail = [canCash && 'efectivo', canTransfer && 'transferencia', canPaypal && 'paypal', canMp && 'online'].filter(Boolean);
  const choice = avail.includes(payChoice) ? payChoice : avail[0];
  const payNow = choice === 'paypal' || choice === 'online';
  const METHOD = { efectivo: 'Efectivo al recoger', transferencia: 'Transferencia SPEI', paypal: 'PayPal', online: 'Mercado Pago' };
  const f = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const fail = (m) => { setErr(m); setSending(false); };
    if (!form.name.trim()) return fail('Escribe tu nombre para saber a quién entregar.');
    if (form.phone.replace(/\D/g, '').length < 10) return fail('Escribe un celular de 10 dígitos para coordinar por WhatsApp.');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return fail('Revisa tu correo, parece incompleto.');
    if (delivery === 'envio' && form.address.trim().length < 10) return fail('Escribe la dirección completa de entrega.');
    if (!form.accept) return fail('Acepta el aviso de privacidad y los términos para continuar.');
    if (!user?.uid) return fail('Estamos preparando tu sesión. Espera un segundo e inténtalo otra vez.');
    setErr(''); setSending(true);

    const now = Date.now();
    const order = {
      id: newId(), code: orderCode(), createdAt: now, uid: user.uid,
      customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() },
      delivery, address: delivery === 'envio' ? form.address.trim() : '', notes: form.notes.trim(),
      payChoice: choice, payMethod: METHOD[choice], rush,
      items: cart.map(({ cfg, key, ...rest }) => rest),
      sub: t.sub, disc: t.disc, discPct: t.tier?.pct || 0, rushFee: t.rush, ship: t.ship, total: t.total, deposit: t.deposit,
      paid: 0, payStatus: 'pendiente', status: 'recibido', history: [{ status: 'recibido', at: now }],
      dueDate: ready.toISOString().slice(0, 10), adminNotes: ''
    };
    try { await createOrder(order); }
    catch (e2) {
      const m = {
        size: 'Las imágenes del pedido pesan demasiado. Quita alguna o divide el pedido en dos.',
        storage: 'El navegador se quedó sin espacio. Libera espacio o usa otro navegador.',
        'permission-denied': 'La tienda no aceptó el pedido. Escríbenos por WhatsApp y lo levantamos.'
      };
      return fail(m[e2?.code] || 'No se pudo enviar el pedido. Revisa tu conexión e inténtalo otra vez.');
    }
    clearCart();
    if (choice === 'online' && mode === 'live') {
      try { window.location.assign(await startOnlinePayment(order.id)); return; }
      catch { nav(`/pedido/${order.id}?pago=error`); return; }
    }
    nav(`/pedido/${order.id}?nuevo=1${choice === 'paypal' ? '&pagar=1' : ''}`);
  }

  return (
    <>
      <h1 className="page-title">Tu pedido</h1>
      <div className="two">
        <div className="card">
          {cart.map((i) => (
            <div className="citem" key={i.key}>
              <div className="mini"><Mockup item={i} /></div>
              <div className="cbody">
                <h3>{i.name}</h3>
                <div className="d">
                  <span>{i.mat.name} · {i.tech.name}{i.color ? ` · ${i.color.name}` : ''}</span>
                  <span>Zonas: {i.zones.map((z) => z.label).join(', ')}</span>
                  {i.sizes ? <span>Tallas: {Object.entries(i.sizes).map(([s, n]) => `${s}×${n}`).join(' · ')}</span> : <span>{i.qty} pieza{i.qty === 1 ? '' : 's'}</span>}
                  {i.text && <span>Texto: “{i.text}”</span>}
                  {i.designHelp && <span>Diseño a cargo de Printly</span>}
                </div>
                <div className="cacts">
                  <Link className="btn sm" to={`/producto/${i.pid}?editar=${i.key}`}>Editar</Link>
                  <button className="btn sm ghost danger" onClick={() => removeFromCart(i.key)}>Quitar</button>
                </div>
              </div>
              <div className="num cprice">{money(i.line)}</div>
            </div>
          ))}
          <Link to="/#productos" className="btn ghost sm">+ Agregar otro producto</Link>
        </div>

        <form className="card checkout" onSubmit={submit} noValidate>
          <h3>Datos de contacto</h3>
          <label className="f">Nombre completo<input type="text" value={form.name} onChange={f('name')} autoComplete="name" required /></label>
          <div className="row">
            <label className="f">Celular / WhatsApp<input type="tel" value={form.phone} onChange={f('phone')} autoComplete="tel" placeholder="55 1234 5678" required /></label>
            <label className="f">Correo <span className="hint">opcional</span><input type="email" value={form.email} onChange={f('email')} autoComplete="email" /></label>
          </div>

          <h3>Entrega</h3>
          <div className="radio-cards">
            <button type="button" className="opt" aria-pressed={delivery === 'recoger'} onClick={() => setDelivery('recoger')}>
              <b>Recoger en tienda</b><span>{st.pickupAddress || 'Te confirmamos la dirección por WhatsApp'}</span><em>Gratis</em></button>
            <button type="button" className="opt" aria-pressed={delivery === 'envio'} onClick={() => setDelivery('envio')}>
              <b>Envío a domicilio</b><span>{st.deliveryNote}</span><em>{money(st.deliveryFee)}</em></button>
          </div>
          {delivery === 'envio' && <label className="f">Calle, número, colonia, C.P. y ciudad<input type="text" value={form.address} onChange={f('address')} autoComplete="street-address" /></label>}
          <label className="chk"><input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} /> Pedido urgente: listo en {st.rushDays} días hábiles (+{st.rushPct}%)</label>

          <h3>Pago</h3>
          <div className="paylist">
            {canCash && (
              <button type="button" className="opt" aria-pressed={choice === 'efectivo'} onClick={() => setPayChoice('efectivo')}>
                <b>Efectivo al recoger</b><span>Para clientes de Veracruz. Pagas cuando recoges tu pedido en tienda.</span><em>Veracruz</em></button>
            )}
            {canTransfer && (
              <button type="button" className="opt" aria-pressed={choice === 'transferencia'} onClick={() => setPayChoice('transferencia')}>
                <b>Transferencia bancaria (SPEI)</b><span>Desde cualquier banco de México. Confirmas con el {st.depositPct}% de anticipo y liquidas al entregar.</span><em>Todo México</em></button>
            )}
            {canPaypal && (
              <button type="button" className="opt" aria-pressed={choice === 'paypal'} onClick={() => setPayChoice('paypal')}>
                <b>PayPal</b><span>Con tu cuenta PayPal o tarjeta internacional. Pagas el total.</span><em>Desde el extranjero</em></button>
            )}
            {canMp && (
              <button type="button" className="opt" aria-pressed={choice === 'online'} onClick={() => setPayChoice('online')}>
                <b>Pagar en línea</b><span>Tarjeta de crédito o débito, OXXO o saldo Mercado Pago. Pagas el total.</span><em>Mercado Pago</em></button>
            )}
          </div>
          <label className="f">Comentarios <span className="hint">opcional</span><textarea value={form.notes} onChange={f('notes')} placeholder="Fecha de tu evento, dudas, referencias…" /></label>

          <div className="sumbox">
            <div className="line"><span>Subtotal ({t.qty} pzas.)</span><span className="num">{money(t.sub)}</span></div>
            {t.disc > 0 && <div className="line good"><span>Descuento por volumen {t.tier.pct}%</span><span className="num">−{money(t.disc)}</span></div>}
            {t.rush > 0 && <div className="line"><span>Urgencia</span><span className="num">{money(t.rush)}</span></div>}
            {t.ship > 0 && <div className="line"><span>Envío</span><span className="num">{money(t.ship)}</span></div>}
            <div className="line total"><span>Total</span><span className="num">{money(t.total)}</span></div>
            <div className="line strong"><span>{payNow ? 'A pagar ahora' : choice === 'efectivo' ? 'A pagar al recoger' : `Anticipo para confirmar (${st.depositPct}%)`}</span><span className="num">{money(payNow || choice === 'efectivo' ? t.total : t.deposit)}</span></div>
            <p className="muted small">Entrega estimada: {fmtLongDate(ready)}, contada desde que apruebas el arte.</p>
          </div>

          <label className="chk small"><input type="checkbox" checked={form.accept} onChange={f('accept')} /> <span>Acepto el <Link to="/aviso-de-privacidad" target="_blank">aviso de privacidad</Link> y los <Link to="/terminos" target="_blank">términos y condiciones</Link>.</span></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn primary block lg" type="submit" disabled={sending || !!authError}>
            {sending ? 'Enviando…' : choice === 'online' ? `Pagar ${money(t.total)}` : choice === 'paypal' ? 'Enviar pedido y pagar con PayPal' : 'Enviar pedido'}
          </button>
          {choice === 'online' && <p className="muted small center-text">Te llevaremos a Mercado Pago para pagar de forma segura.</p>}
          {choice === 'paypal' && <p className="muted small center-text">Guardamos tu pedido y en el siguiente paso te mostramos el botón de PayPal.</p>}
        </form>
      </div>
    </>
  );
}
