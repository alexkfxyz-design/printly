import { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { byId } from '../../lib/pricing.js';
import { clone, rid, uniqueId } from '../../lib/format.js';
import { ConfirmButton, Modal, useMoney } from '../../components/ui.jsx';
import { useSaveCatalog } from './Admin.jsx';

/* ---------- Materiales ---------- */
function MaterialEditor({ initial, onClose }) {
  const { catalog } = useStore();
  const save = useSaveCatalog();
  const isNew = !initial.id;
  const [m, setM] = useState(() => ({ ...initial, prods: catalog.products.filter((p) => p.mats.includes(initial.id)).map((p) => p.id) }));
  const [err, setErr] = useState('');
  const toggle = (k, v) => setM((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  async function submit(e) {
    e.preventDefault();
    if (!m.name.trim()) return setErr('Ponle un nombre al material.');
    const c = clone(catalog);
    const { prods, ...mat } = { ...m, name: m.name.trim(), desc: m.desc.trim(), add: Number(m.add) || 0 };
    if (isNew) { mat.id = uniqueId(c.materials, mat.name); c.materials.push(mat); } else c.materials[c.materials.findIndex((x) => x.id === mat.id)] = mat;
    c.products.forEach((p) => { const has = p.mats.includes(mat.id); if (prods.includes(p.id) && !has) p.mats.push(mat.id); if (!prods.includes(p.id) && has) p.mats = p.mats.filter((x) => x !== mat.id); });
    if (await save(c, 'Material guardado')) onClose();
  }
  return (
    <Modal title={m.name || 'Material sin nombre'} eyebrow={isNew ? 'Nuevo material' : 'Editar material'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label className="f">Nombre<input type="text" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></label>
        <label className="f">Descripción para el cliente<input type="text" value={m.desc} onChange={(e) => setM({ ...m, desc: e.target.value })} /></label>
        <label className="f">Recargo sobre el precio base (MXN) <span className="hint">negativo si abarata</span><input type="number" step="1" value={m.add} onChange={(e) => setM({ ...m, add: e.target.value })} /></label>
        <fieldset className="card stack-sm"><legend className="eyebrow">Técnicas compatibles</legend>
          <div className="checks">{catalog.techniques.map((t) => <label key={t.id} className="chk"><input type="checkbox" checked={m.techs.includes(t.id)} onChange={() => toggle('techs', t.id)} /> {t.name}</label>)}</div></fieldset>
        <fieldset className="card stack-sm"><legend className="eyebrow">Productos que lo ofrecen</legend>
          <div className="checks">{catalog.products.map((p) => <label key={p.id} className="chk"><input type="checkbox" checked={m.prods.includes(p.id)} onChange={() => toggle('prods', p.id)} /> {p.name}</label>)}</div></fieldset>
        {err && <p className="err">{err}</p>}
        <button className="btn primary">Guardar material</button>
      </form>
    </Modal>
  );
}

export function Materials() {
  const { catalog } = useStore();
  const save = useSaveCatalog();
  const money = useMoney();
  const [edit, setEdit] = useState(null);
  const remove = (id) => { const c = clone(catalog); c.materials = c.materials.filter((x) => x.id !== id); c.products.forEach((p) => { p.mats = p.mats.filter((x) => x !== id); }); save(c, 'Material eliminado'); };
  return (
    <>
      <div className="toolbar"><button className="btn primary" onClick={() => setEdit({ id: '', name: '', desc: '', add: 0, techs: [] })}>Nuevo material</button></div>
      <div className="tablewrap"><table>
        <thead><tr><th>Material</th><th>Técnicas</th><th>Usado en</th><th className="r">Recargo</th><th /></tr></thead>
        <tbody>{catalog.materials.map((m) => (
          <tr key={m.id}>
            <td><b>{m.name}</b><div className="muted small">{m.desc}</div></td>
            <td className="small">{m.techs.map((t) => byId(catalog.techniques, t)?.name).filter(Boolean).join(', ') || <span className="muted">Ninguna</span>}</td>
            <td className="small">{catalog.products.filter((p) => p.mats.includes(m.id)).map((p) => p.name).join(', ') || <span className="muted">Sin uso</span>}</td>
            <td className="num r">{Number(m.add) ? `${m.add > 0 ? '+' : '−'}${money(Math.abs(m.add))}` : '—'}</td>
            <td className="r nowrap"><button className="btn sm" onClick={() => setEdit(m)}>Editar</button> <ConfirmButton onConfirm={() => remove(m.id)} confirmLabel="¿Eliminar?">Eliminar</ConfirmButton></td>
          </tr>
        ))}</tbody>
      </table></div>
      {edit && <MaterialEditor initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

/* ---------- Técnicas ---------- */
function TechniqueEditor({ initial, onClose }) {
  const { catalog } = useStore();
  const save = useSaveCatalog();
  const isNew = !initial.id;
  const [t, setT] = useState(() => ({ ...initial, mats: catalog.materials.filter((m) => m.techs.includes(initial.id)).map((m) => m.id) }));
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (!t.name.trim()) return setErr('Ponle un nombre a la técnica.');
    const c = clone(catalog);
    const { mats, ...tech } = { ...t, name: t.name.trim(), desc: t.desc.trim(), add: Number(t.add) || 0 };
    if (isNew) { tech.id = uniqueId(c.techniques, tech.name); c.techniques.push(tech); } else c.techniques[c.techniques.findIndex((x) => x.id === tech.id)] = tech;
    c.materials.forEach((m) => { const has = m.techs.includes(tech.id); if (mats.includes(m.id) && !has) m.techs.push(tech.id); if (!mats.includes(m.id) && has) m.techs = m.techs.filter((x) => x !== tech.id); });
    if (await save(c, 'Técnica guardada')) onClose();
  }
  return (
    <Modal title={t.name || 'Técnica sin nombre'} eyebrow={isNew ? 'Nueva técnica' : 'Editar técnica'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label className="f">Nombre<input type="text" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></label>
        <label className="f">Descripción para el cliente<input type="text" value={t.desc} onChange={(e) => setT({ ...t, desc: e.target.value })} /></label>
        <label className="f">Recargo por pieza (MXN)<input type="number" min="0" value={t.add} onChange={(e) => setT({ ...t, add: e.target.value })} /></label>
        <fieldset className="card stack-sm"><legend className="eyebrow">Materiales donde se puede usar</legend>
          <div className="checks">{catalog.materials.map((m) => <label key={m.id} className="chk"><input type="checkbox" checked={t.mats.includes(m.id)} onChange={() => setT((x) => ({ ...x, mats: x.mats.includes(m.id) ? x.mats.filter((y) => y !== m.id) : [...x.mats, m.id] }))} /> {m.name}</label>)}</div></fieldset>
        {err && <p className="err">{err}</p>}
        <button className="btn primary">Guardar técnica</button>
      </form>
    </Modal>
  );
}

export function Techniques() {
  const { catalog } = useStore();
  const save = useSaveCatalog();
  const money = useMoney();
  const [edit, setEdit] = useState(null);
  const remove = (id) => { const c = clone(catalog); c.techniques = c.techniques.filter((x) => x.id !== id); c.materials.forEach((m) => { m.techs = m.techs.filter((x) => x !== id); }); save(c, 'Técnica eliminada'); };
  return (
    <>
      <div className="toolbar"><button className="btn primary" onClick={() => setEdit({ id: '', name: '', desc: '', add: 0 })}>Nueva técnica</button></div>
      <div className="tablewrap"><table>
        <thead><tr><th>Técnica</th><th>Disponible en</th><th className="r">Recargo por pieza</th><th /></tr></thead>
        <tbody>{catalog.techniques.map((t) => (
          <tr key={t.id}>
            <td><b>{t.name}</b><div className="muted small">{t.desc}</div></td>
            <td className="small">{catalog.materials.filter((m) => m.techs.includes(t.id)).map((m) => m.name).join(', ') || <span className="muted">Ningún material</span>}</td>
            <td className="num r">{Number(t.add) ? `+${money(t.add)}` : '—'}</td>
            <td className="r nowrap"><button className="btn sm" onClick={() => setEdit(t)}>Editar</button> <ConfirmButton onConfirm={() => remove(t.id)} confirmLabel="¿Eliminar?">Eliminar</ConfirmButton></td>
          </tr>
        ))}</tbody>
      </table></div>
      {edit && <TechniqueEditor initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

/* ---------- Categorías, colores y tallas ---------- */
export function Lists() {
  const { catalog } = useStore();
  const save = useSaveCatalog();
  const [cats, setCats] = useState(() => catalog.categories.map((k) => ({ ...k })));
  const [cols, setCols] = useState(() => catalog.colors.map((k) => ({ ...k })));
  const [sizes, setSizes] = useState(() => catalog.sizes.join(', '));
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    const cc = cats.filter((k) => k.name.trim()), co = cols.filter((k) => k.name.trim());
    if (!cc.length) return setErr('Deja al menos una categoría.');
    const c = clone(catalog);
    c.categories = cc.map((k) => ({ id: k.id.startsWith('new-') ? uniqueId(cc.filter((x) => !x.id.startsWith('new-')), k.name) : k.id, name: k.name.trim() }));
    c.colors = co.map((k) => ({ id: k.id.startsWith('new-') ? uniqueId(co.filter((x) => !x.id.startsWith('new-')), k.name) : k.id, name: k.name.trim(), hex: k.hex }));
    c.sizes = sizes.split(',').map((s) => s.trim()).filter(Boolean);
    c.products.forEach((p) => {
      p.colors = p.colors.filter((id) => c.colors.some((k) => k.id === id));
      p.sizes = (p.sizes || []).filter((s) => c.sizes.includes(s));
      if (!c.categories.some((k) => k.id === p.cat)) p.cat = c.categories[0].id;
    });
    setErr('');
    await save(c);
  }
  return (
    <form className="two" onSubmit={submit}>
      <div className="card stack">
        <h3>Categorías</h3>
        {cats.map((k, i) => (
          <div className="listrow" key={k.id}>
            <input type="text" value={k.name} aria-label="Nombre de categoría" onChange={(e) => setCats(cats.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <button type="button" className="btn sm ghost danger" onClick={() => setCats(cats.filter((_, j) => j !== i))}>Quitar</button>
          </div>
        ))}
        <button type="button" className="btn sm" onClick={() => setCats([...cats, { id: `new-${rid()}`, name: '' }])}>Agregar categoría</button>
        <h3>Tallas</h3>
        <label className="f">Tallas disponibles, separadas por coma<input type="text" value={sizes} onChange={(e) => setSizes(e.target.value)} /></label>
      </div>
      <div className="card stack">
        <h3>Colores de producto</h3>
        {cols.map((k, i) => (
          <div className="listrow c3" key={k.id}>
            <input type="color" value={k.hex} aria-label="Color" onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} />
            <input type="text" value={k.name} aria-label="Nombre del color" onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <button type="button" className="btn sm ghost danger" onClick={() => setCols(cols.filter((_, j) => j !== i))}>Quitar</button>
          </div>
        ))}
        <button type="button" className="btn sm" onClick={() => setCols([...cols, { id: `new-${rid()}`, name: '', hex: '#888888' }])}>Agregar color</button>
      </div>
      <div className="span2 stack-sm">{err && <p className="err">{err}</p>}<div><button className="btn primary">Guardar cambios</button></div></div>
    </form>
  );
}
