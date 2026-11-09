import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { byId, nextTier, priceItem } from '../lib/pricing.js';
import { AREAS, FONTS, hasBack } from '../lib/mockup.js';
import { compressImage } from '../lib/image.js';
import { clone, rid } from '../lib/format.js';
import Mockup from '../components/Mockup.jsx';
import { Loading, Empty, useMoney, useTitle } from '../components/ui.jsx';

function newCfg(catalog, p) {
  const mat = byId(catalog.materials, p.mats[0]);
  const zones = {};
  (p.zones || []).forEach((z, i) => { zones[z.key] = { on: i === 0 }; });
  const sizes = {};
  if (p.useSizes) { (p.sizes || []).forEach((s) => { sizes[s] = 0; }); if (p.sizes?.length) sizes[p.sizes.includes('M') ? 'M' : p.sizes[0]] = 1; }
  return {
    matId: mat?.id, techId: (mat?.techs || []).find((t) => byId(catalog.techniques, t)), color: p.colors[0] || null, zones, sizes,
    qty: Math.max(1, Number(p.minQty) || 1), text: '', textFont: 'script', textZone: p.zones?.[0]?.key || 'frente',
    textColor: '#1E1D22', notes: '', designHelp: false
  };
}

export default function Product() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const editKey = params.get('editar');
  const nav = useNavigate();
  const { catalog, cart, addToCart, toast } = useStore();
  const money = useMoney();
  const p = catalog && byId(catalog.products, id);
  useTitle(p?.name);

  const [cfg, setCfg] = useState(null);
  const [side, setSide] = useState('front');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!p) return;
    const editing = editKey && cart.find((i) => i.key === editKey);
    setCfg(editing ? clone(editing.cfg) : newCfg(catalog, p));
    setSide('front');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id, editKey]);

  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const setZone = (key, patch) => setCfg((c) => ({ ...c, zones: { ...c.zones, [key]: { ...c.zones[key], ...patch } } }));

  const qty = cfg && (p.useSizes ? Object.values(cfg.sizes).reduce((s, n) => s + (Number(n) || 0), 0) : Number(cfg.qty) || 0);
  const r = useMemo(() => cfg && priceItem(catalog, p, {
    matId: cfg.matId, techId: cfg.techId, zoneKeys: Object.keys(cfg.zones).filter((k) => cfg.zones[k].on), qty, designHelp: cfg.designHelp
  }), [cfg, catalog, p, qty]);

  if (!catalog) return <Loading />;
  if (!p || !p.active) return <Empty title="Producto no disponible" action={<Link className="btn primary" to="/">Ver catálogo</Link>}>Puede que ya no esté en el catálogo.</Empty>;
  if (!cfg) return <Loading />;

  const mat = r.mat;
  const techs = (mat?.techs || []).map((t) => byId(catalog.techniques, t)).filter(Boolean);
  const col = byId(catalog.colors, cfg.color);
  const back = hasBack(p.shape);
  const item = {
    shape: p.shape, color: col ? { name: col.name, hex: col.hex } : null,
    zones: (p.zones || []).filter((z) => cfg.zones[z.key]?.on).map((z) => ({ key: z.key, img: cfg.zones[z.key].img || null })),
    text: cfg.text, textFont: cfg.textFont, textZone: cfg.textZone, textColor: cfg.textColor
  };
  const cartQty = cart.filter((i) => i.key !== editKey).reduce((s, i) => s + i.qty, 0) + qty;
  const nt = nextTier(cartQty, catalog.settings);

  let err = '';
  if (!r.zones.length) err = 'Elige al menos una zona de impresión.';
  else if (!cfg.techId) err = 'Elige una técnica de impresión.';
  else if (qty < Math.max(1, Number(p.minQty) || 1)) err = p.minQty > 1 ? `El mínimo es ${p.minQty} piezas.` : 'Indica al menos 1 pieza.';
  else if (!cfg.designHelp) {
    const missing = r.zones.find((z) => !cfg.zones[z.key].img && !(cfg.text && cfg.textZone === z.key));
    if (missing) err = `Sube una imagen para "${missing.label}", escribe un texto ahí o pide que diseñemos por ti.`;
  }

  async function onUpload(key, file) {
    if (!file) return;
    setBusy(key);
    try {
      const img = await compressImage(file, 900, 0.8);
      setZone(key, { on: true, img: img.data, name: img.name, w: img.width, h: img.height });
      const sd = AREAS[p.shape]?.[key]?.[4]; if (sd && back) setSide(sd);
    } catch (e) { toast(e.message); }
    setBusy('');
  }

  function add() {
    if (err) return;
    const key = editKey || rid();
    addToCart({
      key, pid: p.id, name: p.name, shape: p.shape, cfg: clone(cfg),
      mat: { id: mat?.id, name: mat?.name }, tech: { id: r.tech?.id, name: r.tech?.name }, color: item.color,
      zones: r.zones.map((z) => ({ key: z.key, label: z.label, img: cfg.zones[z.key].img || null, name: cfg.zones[z.key].name || null, w: cfg.zones[z.key].w || null, h: cfg.zones[z.key].h || null })),
      sizes: p.useSizes ? Object.fromEntries(Object.entries(cfg.sizes).filter(([, n]) => Number(n) > 0).map(([s, n]) => [s, Number(n)])) : null,
      qty, text: cfg.text, textFont: cfg.textFont, textZone: cfg.textZone, textColor: cfg.textColor, notes: cfg.notes,
      designHelp: cfg.designHelp, unit: r.unit, design: r.design, line: r.line
    });
    toast(editKey ? 'Producto actualizado' : 'Agregado al carrito');
    nav('/carrito');
  }

  return (
    <>
      <nav className="crumbs" aria-label="Ruta"><Link to="/">Tienda</Link><span>/</span><Link to="/#productos">{byId(catalog.categories, p.cat)?.name}</Link><span>/</span><span>{p.name}</span></nav>
      <div className="cust">
        <div className="preview" aria-live="polite">
          {back && (
            <div className="sidetabs">
              <button className="chip" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Vista frontal</button>
              <button className="chip" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Vista posterior</button>
            </div>
          )}
          <Mockup item={item} side={back ? side : 'front'} guides />
          <p className="muted small center-text">Vista referencial. Antes de imprimir te enviamos el arte final para aprobar.</p>
          {p.photos?.length > 0 && (
            <div className="pgal">
              <span className="kicker">Trabajos reales</span>
              <div className="thumbs">
                {p.photos.map((src, i) => <button key={src + i} onClick={() => setPhoto(i)} aria-label={`Ver foto ${i + 1}`}><img src={src} alt="" loading="lazy" /></button>)}
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div>
            <div className="eyebrow">{byId(catalog.categories, p.cat)?.name}</div>
            <h1 className="ptitle">{p.name}</h1>
            <p className="muted">{p.desc}</p>
          </div>

          <section className="step">
            <h3>Material <small>{p.mats.length} opci{p.mats.length === 1 ? 'ón' : 'ones'}</small></h3>
            <div className="opts">
              {p.mats.map((mid) => byId(catalog.materials, mid)).filter(Boolean).map((m) => (
                <button key={m.id} className="opt" aria-pressed={cfg.matId === m.id}
                  onClick={() => set({ matId: m.id, techId: m.techs.includes(cfg.techId) ? cfg.techId : m.techs.find((t) => byId(catalog.techniques, t)) })}>
                  <b>{m.name}</b><span>{m.desc}</span>{Number(m.add) !== 0 && <em>{m.add > 0 ? '+' : '−'}{money(Math.abs(m.add))}</em>}
                </button>
              ))}
            </div>
          </section>

          <section className="step">
            <h3>Técnica de impresión</h3>
            <div className="opts">
              {techs.length ? techs.map((t) => (
                <button key={t.id} className="opt" aria-pressed={cfg.techId === t.id} onClick={() => set({ techId: t.id })}>
                  <b>{t.name}</b><span>{t.desc}</span>{Number(t.add) > 0 && <em>+{money(t.add)} c/u</em>}
                </button>
              )) : <p className="muted">Este material no tiene técnicas configuradas.</p>}
            </div>
          </section>

          {p.colors.length > 0 && (
            <section className="step">
              <h3>Color <small>{col?.name}</small></h3>
              <div className="swatches">
                {p.colors.map((cid) => byId(catalog.colors, cid)).filter(Boolean).map((k) => (
                  <button key={k.id} className="sw" aria-pressed={cfg.color === k.id} title={k.name} aria-label={k.name} style={{ background: k.hex }} onClick={() => set({ color: k.id })} />
                ))}
              </div>
            </section>
          )}

          <section className="step">
            <h3>Zonas de impresión y diseño</h3>
            {(p.zones || []).map((z) => {
              const zc = cfg.zones[z.key] || {};
              const low = zc.img && Math.max(zc.w || 0, zc.h || 0) < 1200;
              return (
                <div className="zone" key={z.key}>
                  <label className="chk"><input type="checkbox" checked={!!zc.on} aria-label={z.label}
                    onChange={(e) => { setZone(z.key, { on: e.target.checked }); const sd = AREAS[p.shape]?.[z.key]?.[4]; if (e.target.checked && sd && back) setSide(sd); }} /></label>
                  <div className="meta">
                    <b>{z.label} {Number(z.extra) > 0 && <span className="muted fw5">+{money(z.extra)}</span>}</b>
                    {zc.img ? (
                      <><span className="file">{zc.name} · {zc.w}×{zc.h}px</span>{low && <span className="warn">Resolución baja: podría verse pixelado</span>}</>
                    ) : <span className="file">{zc.on ? 'PNG o JPG, ideal 3000 px y fondo transparente' : 'No incluida'}</span>}
                  </div>
                  <div className="zone-actions">
                    {zc.img && <><div className="thumb"><img src={zc.img} alt="" /></div><button className="btn sm ghost" onClick={() => setZone(z.key, { img: null, name: null, w: null, h: null })}>Quitar</button></>}
                    <label className="btn sm upl">{busy === z.key ? 'Cargando…' : zc.img ? 'Cambiar' : 'Subir imagen'}
                      <input type="file" accept="image/*" onChange={(e) => { onUpload(z.key, e.target.files?.[0]); e.target.value = ''; }} aria-label={`Subir imagen para ${z.label}`} />
                    </label>
                  </div>
                </div>
              );
            })}
            <label className="chk"><input type="checkbox" checked={cfg.designHelp} onChange={(e) => set({ designHelp: e.target.checked })} /> Quiero que Printly diseñe el arte por mí (+{money(catalog.settings.designFee)} por modelo)</label>
          </section>

          <section className="step">
            <h3>Texto o nombre <small>opcional</small></h3>
            <div className="row">
              <label className="f">Texto<input type="text" maxLength={40} placeholder="Ej. Aldair" value={cfg.text} onChange={(e) => set({ text: e.target.value })} /></label>
              <label className="f">Estilo<select value={cfg.textFont} onChange={(e) => set({ textFont: e.target.value })}>{Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}</select></label>
            </div>
            <div className="row">
              <label className="f">Ubicación<select value={cfg.textZone} onChange={(e) => { set({ textZone: e.target.value }); const sd = AREAS[p.shape]?.[e.target.value]?.[4]; if (sd && back) setSide(sd); }}>
                {(p.zones || []).map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}</select></label>
              <label className="f">Color del texto<input type="color" className="colorin" value={cfg.textColor} onChange={(e) => set({ textColor: e.target.value })} /></label>
            </div>
          </section>

          <section className="step">
            <h3>{p.useSizes ? 'Tallas y cantidades' : 'Cantidad'}</h3>
            {p.useSizes ? (
              <div className="sizes">
                {(p.sizes || []).map((s) => (
                  <label key={s}>{s}<input type="number" min="0" inputMode="numeric" value={cfg.sizes[s] ?? 0}
                    onChange={(e) => set({ sizes: { ...cfg.sizes, [s]: Math.max(0, parseInt(e.target.value) || 0) } })} /></label>
                ))}
              </div>
            ) : (
              <div className="row"><label className="f" style={{ maxWidth: 160 }}>Piezas<input type="number" min="1" inputMode="numeric" value={cfg.qty} onChange={(e) => set({ qty: Math.max(0, parseInt(e.target.value) || 0) })} /></label></div>
            )}
            {p.minQty > 1 && <p className="muted small">Pedido mínimo: {p.minQty} piezas.</p>}
            <label className="f">Indicaciones para el equipo<textarea value={cfg.notes} placeholder="Tamaño del estampado, colores exactos, referencia…" onChange={(e) => set({ notes: e.target.value })} /></label>
          </section>

          <div className="pricebox">
            <div className="line"><span>Precio por pieza</span><span className="num">{money(r.unit)}</span></div>
            <div className="line"><span>Piezas</span><span className="num">× {qty}</span></div>
            {r.design > 0 && <div className="line"><span>Diseño por Printly</span><span className="num">{money(r.design)}</span></div>}
            <div className="line total"><span>Subtotal</span><span className="num">{money(r.line)}</span></div>
            {nt && <p className="tiers">Lleva {nt.qty - cartQty} pieza{nt.qty - cartQty === 1 ? '' : 's'} más en tu pedido y obtén {nt.pct}% de descuento.</p>}
            {err && <p className="err">{err}</p>}
            <button className="btn primary block lg" disabled={!!err} onClick={add}>{editKey ? 'Guardar cambios' : 'Agregar al carrito'}</button>
          </div>
        </div>
      </div>

      {photo !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={p.name} onMouseDown={(e) => e.target === e.currentTarget && setPhoto(null)}>
          <div className="lb-in">
            <img src={p.photos[photo]} alt={p.name} />
            <div className="lb-bar">
              <span>{p.name} · {photo + 1}/{p.photos.length}</span>
              <div>
                {p.photos.length > 1 && <>
                  <button className="btn sm" onClick={() => setPhoto((photo - 1 + p.photos.length) % p.photos.length)} aria-label="Anterior">←</button>
                  <button className="btn sm" onClick={() => setPhoto((photo + 1) % p.photos.length)} aria-label="Siguiente">→</button>
                </>}
                <button className="btn sm primary" onClick={() => setPhoto(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
