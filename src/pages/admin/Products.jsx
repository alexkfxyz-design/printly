import { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { byId } from '../../lib/pricing.js';
import { AREAS, AREA_NAMES, SHAPES } from '../../lib/mockup.js';
import { compressImage } from '../../lib/image.js';
import { clone, uniqueId } from '../../lib/format.js';
import Mockup from '../../components/Mockup.jsx';
import { ConfirmButton, Modal, useMoney } from '../../components/ui.jsx';
import { useSaveCatalog } from './Admin.jsx';

const BLANK = { id: '', name: '', cat: '', shape: 'tee', base: 200, minQty: 1, desc: '', badge: '', active: true, mats: [], colors: [], useSizes: false, sizes: [], zones: [{ key: 'frente', label: 'Frente', extra: 0 }], photos: [] };

function Editor({ initial, onClose }) {
  const { catalog, toast } = useStore();
  const save = useSaveCatalog();
  const [p, setP] = useState(() => ({ ...clone(initial), cat: initial.cat || catalog.categories[0]?.id }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isNew = !initial.id;
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const toggle = (k, v) => setP((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const zone = (k) => p.zones.find((z) => z.key === k);
  const setZone = (k, patch) => setP((x) => ({ ...x, zones: x.zones.map((z) => (z.key === k ? { ...z, ...patch } : z)) }));

  function changeShape(shape) {
    const keep = p.zones.filter((z) => AREAS[shape][z.key]);
    set({ shape, zones: keep.length ? keep : [{ key: 'frente', label: 'Frente', extra: 0 }] });
  }
  async function addPhoto(file) {
    if (!file) return;
    try { const r = await compressImage(file, 900, 0.75); set({ photos: [...(p.photos || []), r.data] }); }
    catch (e) { toast(e.message); }
  }
  async function submit(e) {
    e.preventDefault();
    const out = { ...p, name: p.name.trim(), desc: p.desc.trim(), badge: (p.badge || '').trim(), base: Number(p.base) || 0, minQty: Math.max(1, Number(p.minQty) || 1),
      zones: p.zones.map(({ on, ...z }) => ({ ...z, extra: Number(z.extra) || 0 })), sizes: catalog.sizes.filter((s) => p.sizes.includes(s)) };
    if (!out.name) return setErr('Ponle un nombre al producto.');
    if (!out.mats.length) return setErr('Marca al menos un material.');
    if (!out.zones.length) return setErr('Marca al menos una zona de impresión.');
    if (out.useSizes && !out.sizes.length) return setErr('Marca las tallas o desmarca "Se vende por tallas".');
    setBusy(true);
    const cat = clone(catalog);
    if (isNew) { out.id = uniqueId(cat.products, out.name); cat.products.push(out); }
    else cat.products[cat.products.findIndex((x) => x.id === out.id)] = out;
    if (await save(cat, 'Producto guardado')) onClose(); else setBusy(false);
  }

  return (
    <Modal title={p.name || 'Producto sin nombre'} eyebrow={isNew ? 'Nuevo producto' : 'Editar producto'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label className="f">Nombre<input type="text" value={p.name} onChange={(e) => set({ name: e.target.value })} required /></label>
        <div className="row">
          <label className="f">Categoría<select value={p.cat} onChange={(e) => set({ cat: e.target.value })}>{catalog.categories.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
          <label className="f">Molde de vista previa<select value={p.shape} onChange={(e) => changeShape(e.target.value)}>{Object.entries(SHAPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        </div>
        <div className="row">
          <label className="f">Precio base (MXN)<input type="number" step="1" min="0" value={p.base} onChange={(e) => set({ base: e.target.value })} /></label>
          <label className="f">Pedido mínimo<input type="number" min="1" value={p.minQty} onChange={(e) => set({ minQty: e.target.value })} /></label>
          <label className="f">Etiqueta <span className="hint">opcional</span><input type="text" maxLength={22} value={p.badge || ''} placeholder="Más pedido" onChange={(e) => set({ badge: e.target.value })} /></label>
        </div>
        <label className="f">Descripción<input type="text" value={p.desc} onChange={(e) => set({ desc: e.target.value })} /></label>
        <label className="chk"><input type="checkbox" checked={p.active} onChange={(e) => set({ active: e.target.checked })} /> Visible en la tienda</label>

        <fieldset className="card stack-sm"><legend className="eyebrow">Fotos</legend>
          <p className="muted small">La primera es la portada. Sin fotos se muestra la vista previa dibujada. Recomendado: máximo 8 fotos subidas desde aquí.</p>
          <div className="phedit">
            {(p.photos || []).map((src, i) => (
              <div className="phi" key={i}>
                <img src={src} alt={`Foto ${i + 1}`} />
                {i === 0 && <span className="tag">Portada</span>}
                <div className="phi-acts">
                  {i > 0 && <button type="button" className="btn sm" onClick={() => { const ph = [...p.photos]; ph.unshift(...ph.splice(i, 1)); set({ photos: ph }); }}>Portada</button>}
                  <button type="button" className="btn sm danger" onClick={() => set({ photos: p.photos.filter((_, j) => j !== i) })}>Quitar</button>
                </div>
              </div>
            ))}
            <label className="phadd">+ Agregar foto<input type="file" accept="image/*" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ''; }} /></label>
          </div>
        </fieldset>

        <fieldset className="card stack-sm"><legend className="eyebrow">Materiales</legend>
          <div className="checks">{catalog.materials.map((m) => <label key={m.id} className="chk"><input type="checkbox" checked={p.mats.includes(m.id)} onChange={() => toggle('mats', m.id)} /> {m.name}</label>)}</div>
        </fieldset>
        <fieldset className="card stack-sm"><legend className="eyebrow">Colores</legend>
          <p className="muted small">Sin colores, el producto se muestra en su color natural (vidrio, cerámica blanca…).</p>
          <div className="checks">{catalog.colors.map((k) => <label key={k.id} className="chk"><input type="checkbox" checked={p.colors.includes(k.id)} onChange={() => toggle('colors', k.id)} /> <span className="swatch-sm" style={{ background: k.hex }} /> {k.name}</label>)}</div>
        </fieldset>
        <fieldset className="card stack-sm"><legend className="eyebrow">Tallas</legend>
          <label className="chk"><input type="checkbox" checked={p.useSizes} onChange={(e) => set({ useSizes: e.target.checked })} /> Se vende por tallas</label>
          {p.useSizes && <div className="checks">{catalog.sizes.map((s) => <label key={s} className="chk"><input type="checkbox" checked={p.sizes.includes(s)} onChange={() => toggle('sizes', s)} /> {s}</label>)}</div>}
        </fieldset>
        <fieldset className="card stack-sm"><legend className="eyebrow">Zonas de impresión</legend>
          <div className="zoneedit head"><span /><span>Nombre para el cliente</span><span>Recargo</span></div>
          {Object.keys(AREAS[p.shape]).map((k) => {
            const z = zone(k);
            return (
              <div className="zoneedit" key={k}>
                <input type="checkbox" checked={!!z} aria-label={AREA_NAMES[k]} onChange={(e) => setP((x) => ({ ...x, zones: e.target.checked ? Object.keys(AREAS[x.shape]).map((key) => (key === k ? { key, label: AREA_NAMES[key], extra: 0 } : x.zones.find((zz) => zz.key === key))).filter(Boolean) : x.zones.filter((zz) => zz.key !== k) }))} />
                <input type="text" disabled={!z} value={z?.label ?? AREA_NAMES[k]} onChange={(e) => setZone(k, { label: e.target.value })} aria-label="Nombre de la zona" />
                <input type="number" min="0" disabled={!z} value={z?.extra ?? 0} onChange={(e) => setZone(k, { extra: e.target.value })} aria-label="Recargo" />
              </div>
            );
          })}
        </fieldset>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Guardando…' : isNew ? 'Crear producto' : 'Guardar producto'}</button>
      </form>
    </Modal>
  );
}

export default function Products() {
  const { catalog } = useStore();
  const save = useSaveCatalog();
  const money = useMoney();
  const [edit, setEdit] = useState(null);
  const update = (fn, msg) => { const c = clone(catalog); fn(c); save(c, msg); };
  const move = (i, d) => update((c) => { const [x] = c.products.splice(i, 1); c.products.splice(i + d, 0, x); }, 'Orden actualizado');

  return (
    <>
      <div className="toolbar"><button className="btn primary" onClick={() => setEdit(BLANK)}>Nuevo producto</button><span className="muted small">{catalog.products.filter((p) => p.active).length} de {catalog.products.length} visibles en la tienda</span></div>
      <div className="alist">
        {catalog.products.map((p, i) => (
          <div className={`arow ${p.active ? '' : 'off'}`} key={p.id}>
            <div className="mini">{p.photos?.[0] ? <img src={p.photos[0]} alt="" /> : <Mockup item={{ shape: p.shape, color: byId(catalog.colors, p.colors[0]), zones: [] }} sample />}</div>
            <div className="minw0">
              <h3>{p.name} <span className="muted num fw6">{money(p.base)}</span></h3>
              <div className="tagline">{byId(catalog.categories, p.cat)?.name || 'Sin categoría'} · {p.mats.map((m) => byId(catalog.materials, m)?.name).filter(Boolean).join(', ')}</div>
              <div className="tagline">{p.photos?.length || 0} fotos · {p.zones.length} zonas · {p.colors.length} colores{p.useSizes ? ` · tallas ${p.sizes.join(' ')}` : ''}</div>
            </div>
            <div className="acts">
              <label className="chk small"><input type="checkbox" checked={p.active} onChange={(e) => update((c) => { byId(c.products, p.id).active = e.target.checked; }, e.target.checked ? 'Visible en la tienda' : 'Oculto de la tienda')} /> Visible</label>
              <button className="btn sm ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="btn sm ghost" disabled={i === catalog.products.length - 1} onClick={() => move(i, 1)} aria-label="Bajar">↓</button>
              <button className="btn sm" onClick={() => setEdit(p)}>Editar</button>
              <button className="btn sm ghost" onClick={() => update((c) => { const d = clone(p); d.id = uniqueId(c.products, `${p.name} copia`); d.name += ' (copia)'; d.active = false; c.products.splice(i + 1, 0, d); }, 'Producto duplicado como oculto')}>Duplicar</button>
              <ConfirmButton onConfirm={() => update((c) => { c.products = c.products.filter((x) => x.id !== p.id); }, 'Producto eliminado')} confirmLabel="¿Eliminar?">Eliminar</ConfirmButton>
            </div>
          </div>
        ))}
      </div>
      {edit && <Editor initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
