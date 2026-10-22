# Printly · Tienda de estampados personalizados

Demo funcional de una tienda de estampados: el cliente personaliza su producto y hace el pedido, y el dueño lo gestiona desde un panel de administración.

No necesita servidor, base de datos ni instalación. Es HTML, CSS y JavaScript puro.

## Cómo probarlo

- **En tu PC:** abre `index.html` con doble clic.
- **En GitHub Pages:**
  1. Sube esta carpeta a un repositorio.
  2. En el repositorio ve a **Settings → Pages**.
  3. En *Source* elige la rama `main` y la carpeta `/ (root)`. Guarda.
  4. En uno o dos minutos tendrás un enlace como `https://tu-usuario.github.io/printly/` para compartir con el cliente.

## Qué incluye

**Tienda (cliente)**
- Catálogo por categorías: playeras, sudaderas, tazas, tarros, termos, llaveros, gorras y tote bags. Precios en MXN con IVA incluido.
- Personalizador: material, técnica de impresión (solo las compatibles con el material), color, zonas de impresión, subida de diseño por zona, texto o nombre, tallas y cantidades.
- Vista previa en vivo del producto con el color y el diseño, en vista frontal y posterior.
- Carrito y checkout: recoger en tienda o envío a domicilio, método de pago (SPEI, OXXO, tarjeta, efectivo), pedido urgente, descuento por volumen y anticipo.
- "Mis pedidos" con el avance de cada pedido.

**Panel de administración** (menú *Administrar*)
- Pedidos: resumen, filtros, búsqueda, cambio de estado, registro de pagos, fecha de entrega, notas internas y descarga de los diseños.
- Productos: crear, editar, duplicar, ocultar y eliminar.
- Materiales y técnicas, con sus recargos y compatibilidades.
- Categorías, colores y tallas.
- Ajustes: WhatsApp, datos para depósito (CLABE/cuenta), costo de envío, días de producción, urgencia, anticipo y descuentos.

## Importante

Es una demo: los pedidos y cambios se guardan en el navegador de quien la usa (`localStorage`). Cada persona ve sus propios datos y nadie más los recibe. Para restablecer todo: *Administrar → Ajustes de la tienda → Restablecer datos de prueba*.

Para producción haría falta un backend (por ejemplo Firebase) que guarde pedidos y archivos, y un login para el panel de administración.

## Estructura

```
index.html        Página principal
css/styles.css    Estilos (modo claro y oscuro)
js/catalogo.js    Catálogo inicial: productos, materiales, técnicas, precios y ajustes
js/app.js         Lógica de la tienda y del panel
img/logo.webp     Logo
img/productos/    Fotos de los productos
```

Para cambiar los productos o precios iniciales, edita `js/catalogo.js`.

Para agregar fotos a un producto: pon la imagen en `img/productos/` y añade su ruta en el campo `photos` de ese producto (la primera es la portada). También se pueden subir desde *Administrar → Productos → Editar*, aunque esas solo quedan en el navegador de quien las sube.

Si cambias `js/catalogo.js` después de haber probado la demo, sube el número de `version` para que los navegadores carguen el catálogo nuevo.
