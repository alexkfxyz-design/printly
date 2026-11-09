import { useStore } from '../context/StoreContext.jsx';
import { useMoney, useTitle } from '../components/ui.jsx';

// Textos base. La dueña puede completar razón social, correo y domicilio en Administrar → Ajustes.
export default function Legal({ kind }) {
  const { settings: st } = useStore();
  const money = useMoney();
  const name = st.legalName || st.shopName || 'Printly';
  const contact = [st.email, st.whatsapp && `WhatsApp ${st.whatsapp}`].filter(Boolean).join(' o ') || 'nuestros canales de contacto';
  const updated = st.legalUpdated || '2026';
  useTitle(kind === 'privacidad' ? 'Aviso de privacidad' : 'Términos y condiciones');

  if (kind === 'privacidad') return (
    <article className="legal">
      <h1 className="page-title">Aviso de privacidad</h1>
      <p className="muted">Última actualización: {updated}</p>
      <h2>Responsable</h2>
      <p>{name}{st.legalAddress ? `, con domicilio en ${st.legalAddress},` : ''} es responsable del tratamiento de los datos personales que nos proporcionas, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>
      <h2>Datos que recabamos</h2>
      <p>Nombre, número de celular, correo electrónico (opcional), dirección de entrega cuando eliges envío, y las imágenes o textos que subes para personalizar tus productos.</p>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Elaborar, producir y entregar tu pedido.</li>
        <li>Contactarte por WhatsApp, llamada o correo para aprobar el diseño, coordinar pagos y entregas.</li>
        <li>Emitir comprobantes y atender aclaraciones o garantías.</li>
      </ul>
      <p>No usamos tus datos con fines publicitarios sin tu consentimiento ni los vendemos a terceros.</p>
      <h2>Con quién los compartimos</h2>
      <p>Solo con proveedores necesarios para operar: la plataforma de pagos (Mercado Pago) cuando pagas en línea, la paquetería cuando eliges envío, y el proveedor de infraestructura donde se almacena la tienda (Google Firebase).</p>
      <h2>Tus diseños</h2>
      <p>Las imágenes que subes se usan solo para producir tu pedido. Al subirlas confirmas que tienes derecho a usarlas. Solo las mostraremos como ejemplo de nuestro trabajo si nos das permiso.</p>
      <h2>Derechos ARCO</h2>
      <p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, o revocar tu consentimiento, escribiéndonos a {contact}. Responderemos en un plazo máximo de 20 días hábiles.</p>
      <h2>Cambios a este aviso</h2>
      <p>Publicaremos cualquier cambio en esta misma página.</p>
    </article>
  );

  return (
    <article className="legal">
      <h1 className="page-title">Términos, envíos y cambios</h1>
      <p className="muted">Última actualización: {updated}</p>
      <h2>Pedidos y diseño</h2>
      <ul>
        <li>La vista previa de la tienda es referencial. Antes de producir te enviamos el arte final para que lo apruebes.</li>
        <li>Después de aprobar el arte no es posible hacer cambios al diseño.</li>
        <li>Los colores impresos pueden variar ligeramente respecto a los de tu pantalla.</li>
        <li>No producimos diseños que infrinjan derechos de terceros o con contenido ofensivo.</li>
      </ul>
      <h2>Precios y pagos</h2>
      <ul>
        <li>Los precios están en pesos mexicanos (MXN) e incluyen IVA.</li>
        <li>Puedes pagar el total en línea con Mercado Pago, o confirmar con un anticipo del {st.depositPct}% por transferencia u OXXO y liquidar al entregar.</li>
        <li>El pedido entra a producción cuando se acredita el pago o el anticipo.</li>
      </ul>
      <h2>Tiempos de entrega</h2>
      <ul>
        <li>Producción normal: {st.normalDays} días hábiles. Urgente: {st.rushDays} días hábiles con un recargo del {st.rushPct}%.</li>
        <li>Los tiempos cuentan desde que apruebas el arte y se acredita tu pago.</li>
      </ul>
      <h2>Envíos</h2>
      <ul>
        <li>Puedes recoger sin costo o elegir envío ({money(st.deliveryFee)}). {st.deliveryNote}.</li>
        <li>Los tiempos de la paquetería se suman a los de producción.</li>
      </ul>
      <h2>Cambios y devoluciones</h2>
      <ul>
        <li>Por ser productos personalizados, no hay cambios por talla o gusto. Revisa la tabla de tallas antes de pedir.</li>
        <li>Si tu producto llega con un defecto de fabricación o de impresión, avísanos dentro de los 5 días siguientes a la entrega con fotos y lo reponemos sin costo.</li>
      </ul>
      <h2>Contacto</h2>
      <p>Para cualquier duda escríbenos a {contact}.</p>
    </article>
  );
}
