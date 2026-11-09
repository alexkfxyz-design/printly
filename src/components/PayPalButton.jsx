import { useEffect, useRef, useState } from 'react';
import { paypalCapture, paypalCreateOrder } from '../lib/db.js';

let sdkPromise = null;
function loadSdk(clientId) {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=MXN&intent=capture&components=buttons&locale=es_MX`;
      s.async = true;
      s.onload = () => resolve(window.paypal);
      s.onerror = () => { sdkPromise = null; reject(new Error('sdk')); };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
}

/** Botones oficiales de PayPal (cuenta PayPal o tarjeta). El cobro se confirma en el servidor. */
export default function PayPalButton({ orderId, clientId, onPaid, onError }) {
  const box = useRef(null);
  const [state, setState] = useState('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let buttons, alive = true;
    loadSdk(clientId).then((paypal) => {
      if (!alive || !box.current) return;
      buttons = paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'pay', height: 48 },
        createOrder: () => paypalCreateOrder(orderId),
        onApprove: async (data, actions) => {
          setState('capturing'); setMsg('');
          try {
            const r = await paypalCapture(orderId, data.orderID);
            if (r.paid || r.already) { setState('done'); onPaid?.(); }
            else { setState('ready'); setMsg('PayPal está revisando tu pago. Te avisaremos cuando se acredite.'); }
          } catch (e) {
            if (e.retry) return actions.restart();
            setState('ready'); setMsg(e.detail || 'No se pudo completar el pago. Inténtalo otra vez.');
          }
        },
        onCancel: () => setMsg('Cancelaste el pago. Puedes intentarlo de nuevo cuando quieras.'),
        onError: (err) => { console.error(err); setMsg('PayPal tuvo un problema. Inténtalo de nuevo o paga por transferencia.'); onError?.(err); }
      });
      if (buttons.isEligible()) buttons.render(box.current).then(() => alive && setState('ready'));
      else setState('unavailable');
    }).catch(() => alive && setState('unavailable'));
    return () => { alive = false; try { buttons?.close(); } catch { /* ignore */ } };
  }, [orderId, clientId, onPaid, onError]);

  if (state === 'unavailable') return <p className="err">No se pudo cargar PayPal en este navegador. Desactiva el bloqueador de anuncios o paga por transferencia.</p>;
  return (
    <div className="paypal-box">
      {state === 'loading' && <p className="muted small">Cargando PayPal…</p>}
      {state === 'capturing' && <p className="muted small">Confirmando tu pago…</p>}
      <div ref={box} hidden={state === 'capturing' || state === 'done'} />
      {msg && <p className="note">{msg}</p>}
    </div>
  );
}
