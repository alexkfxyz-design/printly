# Printly · Tienda de estampados personalizados

Tienda en línea de **Printly** ([@soyprintly.mx](https://instagram.com/soyprintly.mx)).

- Los clientes personalizan playeras, sudaderas, tazas, termos, tarros, tote bags, llaveros e impresiones. Ven el resultado en vivo y pagan en línea con **Mercado Pago** o dejan un anticipo por transferencia/OXXO.
- La dueña gestiona pedidos, productos, precios y ajustes desde un **panel de administración**.

**Stack:** React 18 + Vite · Firebase (Firestore + Authentication) · Netlify (hosting + Functions) · PayPal Checkout (y Mercado Pago opcional).

Sin variables de Firebase el sitio arranca en **modo demo**: todo se guarda en el navegador. Sirve para mostrarlo al cliente antes de conectar los servicios reales.

---

## Publicar en Firebase Hosting

El sitio se aloja en Firebase, en el mismo proyecto que la base de datos (`printly-store`).

**Primera vez:**
```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy --only hosting,firestore:rules
```
Queda publicado en **https://printly-store.web.app**. Ese dominio ya está autorizado para el inicio de sesión.

**Cada vez que cambies algo:** `npm run build` y luego `firebase deploy --only hosting`.

**Publicación automática con GitHub (opcional):**
1. Firebase → Configuración del proyecto → Cuentas de servicio → **Generar nueva clave privada**.
2. GitHub → repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - Nombre: `FIREBASE_SERVICE_ACCOUNT_PRINTLY_STORE`
   - Valor: el contenido completo del `.json` descargado.
3. Desde ahí, cada `git push` a `main` publica solo. Lo hace `.github/workflows/firebase-hosting.yml`.

**Dominio propio:** Firebase → Hosting → **Agregar dominio personalizado**. Firebase indica los registros DNS. Después agrega ese dominio en Authentication → Configuración → Dominios autorizados.

> Los pagos son en efectivo, por SPEI y con PayPal.me, así que no necesitan servidor y todo funciona con el plan gratuito de Firebase. Las carpetas `netlify/` solo se usan si algún día se aloja en Netlify con PayPal automático o Mercado Pago.

## Desarrollo local

```bash
npm install
cp .env.example .env      # rellena las variables (o déjalas vacías para modo demo)
npm run dev               # http://localhost:5173
npm run build             # genera dist/
```

Para probar también las funciones de Mercado Pago en local: `npm i -g netlify-cli` y luego `netlify dev`.

---

## Puesta en producción (checklist)

### 1. Firebase (~10 min)
1. Entra a https://console.firebase.google.com y crea el proyecto `printly`.
2. **App web:** Configuración del proyecto → *Tus apps* → `</>`. Copia los valores de `firebaseConfig`.
3. **Firestore:** *Compilación → Firestore Database → Crear base de datos*.
   - Ubicación: `nam5` (EE. UU., la más cercana a México).
   - Modo: producción.
4. **Reglas:** en la pestaña *Reglas*, pega `firestore.rules`, cambia el correo de la dueña y pulsa **Publicar**.
5. **Authentication:** *Compilación → Authentication → Comenzar*. Activa:
   - **Correo electrónico/contraseña** (para la dueña).
   - **Anónimo** (para los clientes; no necesitan crear cuenta).
6. **Usuario de la dueña:** pestaña *Usuarios → Agregar usuario*, con el mismo correo de las reglas.
7. **Dominios autorizados:** *Authentication → Configuración → Dominios autorizados*. Agrega el dominio de Netlify (`printly.netlify.app`) y el dominio final (`printly.mx`).
8. **Cuenta de servicio** (para las funciones de pago): *Configuración → Cuentas de servicio → Generar nueva clave privada*. Se descarga un `.json`; conviértelo a base64:
   - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("ruta\clave.json")) | Set-Clipboard`
   - Mac/Linux: `base64 -i clave.json | pbcopy`

### 2. PayPal (~10 min)
1. La dueña necesita una cuenta **PayPal Business**. Desde una cuenta personal se cambia gratis en *Configuración → Cambiar a cuenta empresarial*.
2. Entra a https://developer.paypal.com con esa cuenta → **Apps & Credentials**.
3. Arriba elige **Live** → **Create App** (nombre: `Printly web`, tipo *Merchant*).
4. Copia el **Client ID** y el **Secret**.
5. En Netlify agrega:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_ENV=live`
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` (ver paso 1.8)
6. Redespliega. El botón **Pagar con PayPal** aparece solo en el checkout.

> Para probar sin cobrar: en el paso 3 usa la pestaña **Sandbox**, pon `PAYPAL_ENV=sandbox` y paga con las cuentas de prueba de *Sandbox → Accounts*.

### 2b. Mercado Pago (opcional)
1. La dueña entra a https://www.mercadopago.com.mx/developers con su cuenta de Mercado Pago.
2. *Tus integraciones → Crear aplicación* (tipo: pagos en línea, Checkout Pro).
3. *Credenciales de producción*: copia el **Access Token** (`APP_USR-…`).
4. Después del primer deploy, ve a *Webhooks → Configurar notificaciones*:
   - URL: `https://TU-DOMINIO/.netlify/functions/mp-webhook`
   - Evento: **Pagos**
   - Copia la **clave secreta** que te da.

> Para probar sin cobrar, usa primero las *credenciales de prueba* y las tarjetas de prueba de Mercado Pago.

### 3. Netlify (~5 min)
1. Sube el proyecto a GitHub.
2. En https://app.netlify.com: *Add new site → Import from GitHub*. Netlify lee `netlify.toml`:
   - build: `npm run build`
   - publish: `dist`
   - functions: `netlify/functions`
3. *Site configuration → Environment variables*. Agrega:

| Variable | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Los 6 valores de `firebaseConfig` |
| `VITE_ADMIN_EMAILS` | Correo de la dueña (varios separados por coma) |
| `VITE_SITE_URL` | `https://printly.mx` (o la URL de Netlify mientras no haya dominio) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Credenciales Live de PayPal |
| `PAYPAL_ENV` | `live` |
| `MP_ACCESS_TOKEN` | Access Token de Mercado Pago (opcional) |
| `MP_WEBHOOK_SECRET` | Clave secreta del webhook |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | El JSON de la cuenta de servicio en base64 |

4. **Deploys → Trigger deploy**. Las variables `VITE_` se leen al compilar, así que redespliega cada vez que cambies alguna.

### 4. Publicar el catálogo
1. Abre `https://TU-SITIO/admin` e inicia sesión con la cuenta de la dueña.
2. Pulsa **Publicar catálogo inicial**.
3. En **Ajustes**, completa: WhatsApp, correo, ciudad, datos bancarios para el anticipo y los datos legales (razón social y domicilio para el aviso de privacidad).

### 5. Dominio propio
1. En Netlify: *Domain management → Add a domain* → `printly.mx`.
2. En el proveedor del dominio, apunta los DNS a Netlify (Netlify te muestra los registros exactos). El HTTPS se activa solo.
3. Actualiza:
   - `VITE_SITE_URL` en Netlify, y redespliega.
   - Los *Dominios autorizados* de Firebase.
   - La URL del webhook de Mercado Pago.

---

## Cómo funciona

**Flujo del cliente:**
1. Elige un producto y lo personaliza: material, técnica, color, zonas, imagen, texto y tallas.
2. Lo agrega al carrito.
3. En el checkout elige entrega y forma de pago:
   - **Pagar en línea:** el pedido se guarda y el cliente pasa a Mercado Pago. La función `create-preference` **recalcula el precio en el servidor** con el catálogo de Firestore, así nadie puede alterar el total desde el navegador. Cuando se aprueba el pago, el webhook `mp-webhook` marca el pedido como **Pagado**.
   - **Transferencia/OXXO:** el pedido queda como *Pago pendiente* y se muestran los datos para enviar el anticipo. La dueña registra el pago en el panel.
4. Puede seguir su pedido en `/pedido/{id}` y en **Mis pedidos**. La sesión anónima queda guardada en su navegador.

**Panel `/admin`:**
- **Pedidos en tiempo real:**
  - Indicadores, filtros, búsqueda y exportación a CSV.
  - Detalle del pedido con los diseños descargables.
  - Cambio de estado, pagos, fecha de entrega y notas internas.
  - Botón de WhatsApp al cliente.
- **Productos:**
  - Crear, editar, duplicar, ordenar, ocultar y eliminar.
  - Subir fotos, con compresión automática en el navegador.
  - Configurar zonas, tallas, colores y materiales.
- **Materiales y técnicas**, con recargos y compatibilidades.
- **Categorías, colores y tallas.**
- **Ajustes:** contacto, métodos de pago, anticipo, envío, tiempos, urgencia, descuentos por volumen y datos legales.

## Estructura

```
netlify.toml                  Build, redirecciones SPA, /api → funciones, cabeceras de seguridad
firestore.rules               Reglas de seguridad (pegar en Firebase)
.env.example                  Variables de entorno
netlify/functions/
  paypal-create-order.js      Crea la orden de PayPal (precio recalculado en servidor)
  paypal-capture.js           Cobra y verifica el pago de PayPal, marca el pedido como pagado
  pay-status.js               Indica qué pagos en línea están configurados
  create-preference.js        Crea el pago de Mercado Pago (precio recalculado en servidor)
  mp-webhook.js               Recibe la confirmación de pago y actualiza el pedido
  _lib/admin.js               Firebase Admin
public/img/productos/         Fotos de los productos
src/
  firebase.js                 Conexión a Firebase
  lib/db.js                   Capa de datos (Firestore o modo demo)
  lib/pricing.js              Cálculo de precios (compartido con el servidor)
  lib/mockup.js               Vistas previas SVG de cada producto
  data/catalogoInicial.js     Catálogo inicial
  pages/                      Tienda: Home, Product, Cart, OrderPage, MyOrders, Legal
  pages/admin/                Panel de administración
```

## Datos en Firestore

| Ruta | Contenido |
|---|---|
| `config/tienda` | Ajustes, categorías, colores, tallas, materiales y técnicas |
| `productos/{id}` | Un documento por producto (orden, precio, fotos, zonas…) |
| `pedidos/{id}` | Un documento por pedido. Los diseños se guardan comprimidos (máx. ~1 MB por pedido) |

**Costos:** Firebase plan Spark (gratis), Netlify plan Starter (gratis) y Mercado Pago (comisión por venta).

**Fotos del catálogo:** las fotos de `public/img/productos/` se publican con el sitio. Las que suba la dueña desde el panel se guardan comprimidas en Firestore; conviene no pasar de unas 8 por producto.
