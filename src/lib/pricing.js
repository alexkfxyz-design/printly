// Cálculo de precios. Lo usa la tienda y también la función de Mercado Pago
// (netlify/functions) para recalcular el total en el servidor.

export const byId = (arr, id) => (arr || []).find((x) => x.id === id);

/** Precio unitario y total de una línea a partir de la configuración elegida. */
export function priceItem(catalog, product, sel) {
  const mat = byId(catalog.materials, sel.matId);
  const tech = byId(catalog.techniques, sel.techId);
  const zones = (product.zones || []).filter((z) => (sel.zoneKeys || []).includes(z.key));
  const unit =
    Number(product.base || 0) +
    Number(mat?.add || 0) +
    Number(tech?.add || 0) +
    zones.reduce((s, z) => s + Number(z.extra || 0), 0);
  const qty = Math.max(0, Math.floor(Number(sel.qty) || 0));
  const design = sel.designHelp ? Number(catalog.settings?.designFee || 0) : 0;
  return { mat, tech, zones, unit, qty, design, line: unit * qty + design };
}

/** Totales del pedido: descuento por volumen, urgencia, envío y anticipo. */
export function orderTotals(items, settings = {}, opt = {}) {
  const sub = items.reduce((s, i) => s + Number(i.line || 0), 0);
  const qty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const tier = (settings.discounts || [])
    .filter((t) => qty >= Number(t.qty))
    .sort((a, b) => b.pct - a.pct)[0];
  const disc = tier ? (sub * Number(tier.pct)) / 100 : 0;
  const rush = opt.rush ? ((sub - disc) * Number(settings.rushPct || 0)) / 100 : 0;
  const ship = opt.delivery === 'envio' ? Number(settings.deliveryFee || 0) : 0;
  const total = round2(sub - disc + rush + ship);
  return {
    sub: round2(sub), qty, tier: tier || null, disc: round2(disc), rush: round2(rush), ship: round2(ship), total,
    deposit: round2((total * Number(settings.depositPct || 0)) / 100)
  };
}

export function nextTier(qty, settings = {}) {
  return (settings.discounts || []).filter((t) => Number(t.qty) > qty).sort((a, b) => a.qty - b.qty)[0];
}

/** Recalcula un pedido completo contra el catálogo (lo usa el servidor). */
export function recomputeOrder(catalog, order) {
  const items = (order.items || []).map((it) => {
    const product = byId(catalog.products, it.pid);
    if (!product) throw new Error(`Producto no disponible: ${it.pid}`);
    const r = priceItem(catalog, product, {
      matId: it.mat?.id, techId: it.tech?.id, zoneKeys: (it.zones || []).map((z) => z.key), qty: it.qty, designHelp: it.designHelp
    });
    return { name: product.name, qty: r.qty, unit: r.unit, design: r.design, line: r.line };
  });
  return { items, ...orderTotals(items, catalog.settings, { rush: order.rush, delivery: order.delivery }) };
}

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function addBusinessDays(d, n) {
  const x = new Date(d);
  let k = 0;
  while (k < n) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0) k++; }
  return x;
}
