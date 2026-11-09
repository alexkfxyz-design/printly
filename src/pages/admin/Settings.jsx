import { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { resetDemo } from '../../lib/db.js';
import { clone } from '../../lib/format.js';
import { ConfirmButton } from '../../components/ui.jsx';
import { useSaveCatalog } from './Admin.jsx';

const TEXT = ['shopName', 'whatsapp', 'instagram', 'instagramUrl', 'facebook', 'facebookUrl', 'tiktok', 'tiktokUrl', 'email', 'city', 'pickupAddress', 'deliveryNote', 'payNumber', 'payHolder', 'paypalMe', 'legalName', 'legalAddress', 'legalUpdated'];
const NUM = ['deliveryFee', 'depositPct', 'normalDays', 'rushDays', 'rushPct', 'designFee'];

export default function Settings() {
  const { catalog, mode, toast } = useStore();
  const save = useSaveCatalog();
  const [s, setS] = useState(() => ({ ...catalog.settings, payMethodsText: (catalog.settings.payMethods || []).join('\n'), discounts: (catalog.settings.discounts || []).map((d) => ({ ...d })) }));
  const f = (k) => ({ value: s[k] ?? '', onChange: (e) => setS({ ...s, [k]: e.target.value }) });
  const chk = (k) => ({ checked: s[k] !== false, onChange: (e) => setS({ ...s, [k]: e.target.checked }) });

  async function submit(e) {
    e.preventDefault();
    if (s.transferPay === false && s.paypalPay === false && s.cashPay === false) return toast('Deja activo al menos un método de pago.');
    const c = clone(catalog);
    const st = c.settings;
    TEXT.forEach((k) => { st[k] = String(s[k] ?? '').trim(); });
    NUM.forEach((k) => { st[k] = Math.max(0, Number(s[k]) || 0); });
    st.instagram = st.instagram.replace(/^@/, ''); st.tiktok = st.tiktok.replace(/^@/, '');
    st.onlinePay = s.onlinePay !== false; st.transferPay = s.transferPay !== false; st.paypalPay = s.paypalPay !== false; st.cashPay = s.cashPay !== false;
    st.payMethods = s.payMethodsText.split('\n').map((x) => x.trim()).filter(Boolean);
    st.discounts = s.discounts.map((d) => ({ qty: Number(d.qty), pct: Number(d.pct) })).filter((d) => d.qty > 0 && d.pct > 0).sort((a, b) => a.qty - b.qty);
    await save(c, 'Ajustes guardados');
  }

  return (
    <form className="two" onSubmit={submit}>
      <div className="card stack">
        <h3>Tienda y contacto</h3>
        <label className="f">Nombre de la tienda<input type="text" {...f('shopName')} /></label>
        <div className="row">
          <label className="f">WhatsApp <span className="hint">10 dígitos</span><input type="tel" placeholder="229 174 5486" {...f('whatsapp')} /></label>
          <label className="f">Instagram<input type="text" placeholder="soyprintly.mx" {...f('instagram')} /></label>
        </div>
        <div className="row">
          <label className="f">Correo de contacto<input type="email" {...f('email')} /></label>
          <label className="f">Ciudad<input type="text" placeholder="Ciudad de México" {...f('city')} /></label>
        </div>
        <label className="f">Dirección para recoger<input type="text" {...f('pickupAddress')} /></label>
        <h3>Redes sociales</h3>
        <div className="row">
          <label className="f">Facebook (nombre)<input type="text" placeholder="Printly MX" {...f('facebook')} /></label>
          <label className="f">Enlace de Facebook<input type="url" placeholder="https://www.facebook.com/…" {...f('facebookUrl')} /></label>
        </div>
        <div className="row">
          <label className="f">Enlace de Instagram <span className="hint">opcional</span><input type="url" {...f('instagramUrl')} /></label>
          <label className="f">TikTok<input type="text" placeholder="soyprintly.mx" {...f('tiktok')} /></label>
        </div>
        <label className="f">Enlace de TikTok <span className="hint">opcional</span><input type="url" {...f('tiktokUrl')} /></label>
        <div className="row">
          <label className="f">Costo de envío (MXN)<input type="number" min="0" {...f('deliveryFee')} /></label>
          <label className="f">Cobertura de envío<input type="text" {...f('deliveryNote')} /></label>
        </div>
        <h3>Datos legales</h3>
        <p className="muted small">Aparecen en el aviso de privacidad y los términos.</p>
        <label className="f">Nombre o razón social del responsable<input type="text" {...f('legalName')} /></label>
        <label className="f">Domicilio del responsable<input type="text" {...f('legalAddress')} /></label>
        <label className="f">Fecha de última actualización<input type="text" placeholder="noviembre de 2026" {...f('legalUpdated')} /></label>
      </div>
      <div className="card stack">
        <h3>Pagos</h3>
        <label className="chk"><input type="checkbox" {...chk('cashPay')} /> Efectivo al recoger (solo si el cliente elige recoger en tienda)</label>
        <label className="chk"><input type="checkbox" {...chk('transferPay')} /> Transferencia bancaria SPEI (con anticipo)</label>
        <div className="row">
          <label className="f">CLABE o cuenta<input type="text" {...f('payNumber')} /></label>
          <label className="f">Titular y banco<input type="text" {...f('payHolder')} /></label>
        </div>
        <label className="chk"><input type="checkbox" {...chk('paypalPay')} /> PayPal (pago total)</label>
        <label className="f">Enlace de PayPal.me<input type="url" placeholder="https://paypal.me/soyprintlymx" {...f('paypalMe')} /></label>
        <label className="chk"><input type="checkbox" {...chk('onlinePay')} /> Mercado Pago (solo si está configurado en Netlify)</label>
        <p className="muted small">Si configuras las claves de PayPal en Netlify, el cobro se confirma solo. Sin ellas, el cliente paga con el enlace de PayPal.me y tú marcas el pedido como pagado.</p>
        <label className="f">Anticipo para confirmar (%)<input type="number" min="0" max="100" {...f('depositPct')} /></label>
        <h3>Producción y precios</h3>
        <div className="row">
          <label className="f">Días hábiles normales<input type="number" min="1" {...f('normalDays')} /></label>
          <label className="f">Días con urgencia<input type="number" min="1" {...f('rushDays')} /></label>
        </div>
        <div className="row">
          <label className="f">Recargo por urgencia (%)<input type="number" min="0" {...f('rushPct')} /></label>
          <label className="f">Servicio de diseño (MXN)<input type="number" min="0" {...f('designFee')} /></label>
        </div>
        <h3>Descuentos por volumen</h3>
        <p className="muted small">Se aplican según el total de piezas del pedido.</p>
        {s.discounts.map((d, i) => (
          <div className="row align-end" key={i}>
            <label className="f">Desde (piezas)<input type="number" min="1" value={d.qty} onChange={(e) => setS({ ...s, discounts: s.discounts.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)) })} /></label>
            <label className="f">Descuento (%)<input type="number" min="0" max="90" value={d.pct} onChange={(e) => setS({ ...s, discounts: s.discounts.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)) })} /></label>
            <button type="button" className="btn sm ghost danger grow0" onClick={() => setS({ ...s, discounts: s.discounts.filter((_, j) => j !== i) })}>Quitar</button>
          </div>
        ))}
        <div><button type="button" className="btn sm" onClick={() => setS({ ...s, discounts: [...s.discounts, { qty: 24, pct: 12 }] })}>Agregar nivel</button></div>
      </div>
      <div className="span2 row-wrap">
        <button className="btn primary">Guardar ajustes</button>
        {mode === 'demo' && <ConfirmButton className="btn ghost danger" onConfirm={() => { resetDemo(); toast('Datos de prueba restablecidos'); }} confirmLabel="¿Borrar pedidos y cambios de prueba?">Restablecer datos de prueba</ConfirmButton>}
      </div>
    </form>
  );
}
