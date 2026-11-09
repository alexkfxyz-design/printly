import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { byId } from '../lib/pricing.js';
import Mockup from '../components/Mockup.jsx';
import { Empty, Loading, useMoney, useTitle } from '../components/ui.jsx';

const minPrice = (catalog, p) => Number(p.base) + Math.min(0, ...p.mats.map((m) => Number(byId(catalog.materials, m)?.add || 0)));

function ProductCard({ p }) {
  const { catalog } = useStore();
  const money = useMoney();
  const ph = p.photos || [];
  const colors = p.colors.map((id) => byId(catalog.colors, id)).filter(Boolean);
  return (
    <article className="pcard2">
      <Link to={`/producto/${p.id}`} className={`pimg ${ph[0] ? '' : 'nophoto'}`} aria-label={`Personalizar ${p.name}`}>
        {ph[0] ? (
          <>
            <img src={ph[0]} alt={p.name} loading="lazy" />
            {ph[1] && <img className="alt" src={ph[1]} alt="" loading="lazy" />}
          </>
        ) : (
          <div className="svgwrap"><Mockup item={{ shape: p.shape, color: colors[0], zones: [] }} sample /></div>
        )}
        {p.badge && <span className="tag">{p.badge}</span>}
        {ph.length > 1 && <span className="count">{ph.length} fotos</span>}
      </Link>
      <div className="pinfo">
        <div className="prow"><h3>{p.name}</h3><span className="price">desde <b className="num">{money(minPrice(catalog, p))}</b></span></div>
        <p>{p.desc}</p>
        <div className="pfoot">
          {colors.length > 1 ? (
            <div className="dots" aria-label={`${colors.length} colores`}>
              {colors.slice(0, 6).map((c) => <i key={c.id} style={{ background: c.hex }} title={c.name} />)}
              {colors.length > 6 && <small>+{colors.length - 6}</small>}
            </div>
          ) : (
            <span className="muted mats">{p.mats.map((m) => byId(catalog.materials, m)?.name).filter(Boolean).join(' · ')}</span>
          )}
          <Link to={`/producto/${p.id}`} className="btn primary sm">Personalizar</Link>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  useTitle('');
  const { catalog, settings: st } = useStore();
  const money = useMoney();
  const [cat, setCat] = useState('all');
  const [galShow, setGalShow] = useState(16);

  const active = useMemo(() => (catalog?.products || []).filter((p) => p.active), [catalog]);
  const gallery = useMemo(() => {
    const lists = active.map((p) => (p.photos || []).map((src) => ({ src, p })));
    const mixed = [];
    for (let i = 0; lists.some((l) => l[i]); i++) lists.forEach((l) => l[i] && mixed.push(l[i]));
    return mixed;
  }, [active]);

  if (!catalog) return <Loading label="Cargando la tienda…" />;

  const prods = active.filter((p) => cat === 'all' || p.cat === cat);
  const hero = active.filter((p) => p.photos?.[0]).slice(0, 3);
  const fromAll = active.length ? Math.min(...active.map((p) => minPrice(catalog, p))) : 0;
  const topDiscount = Math.max(0, ...(st.discounts || []).map((d) => d.pct));

  return (
    <>
      <section className="hero2">
        <div className="hero-copy">
          <span className="kicker">Estampados personalizados · desde 1 pieza</span>
          <h1 className="display">Tu idea, <em>estampada</em> en lo que quieras.</h1>
          <p className="lead">Playeras, sudaderas, tazas, termos, tarros y llaveros con tu diseño, tu foto o tu nombre. Lo armas aquí y ves cómo queda antes de pedir.</p>
          <div className="cta">
            <a href="#productos" className="btn primary lg">Personalizar ahora</a>
            <a href="#galeria" className="btn lg">Ver trabajos</a>
          </div>
          <ul className="trust">
            <li><b>Arte para aprobar</b><span>Antes de imprimir</span></li>
            <li><b>{st.normalDays} días hábiles</b><span>O {st.rushDays} con urgencia</span></li>
            <li><b>Paga como prefieras</b><span>Transferencia, OXXO o en línea</span></li>
          </ul>
        </div>
        <div className="collage">
          {hero.map((p, i) => (
            <Link key={p.id} to={`/producto/${p.id}`} className={`ph ph${i + 1}`} aria-label={p.name}>
              <img src={p.photos[0]} alt={`${p.name} personalizado`} fetchpriority={i === 0 ? 'high' : undefined} />
              <span>{p.name}</span>
            </Link>
          ))}
          <span className="sticker" aria-hidden="true">desde<b>{money(fromAll)}</b></span>
        </div>
      </section>

      <section className="cats" aria-label="Categorías">
        {catalog.categories.map((k) => {
          const ps = active.filter((p) => p.cat === k.id);
          const ph = ps.map((p) => p.photos?.[Math.min(2, (p.photos?.length || 1) - 1)]).find(Boolean);
          return (
            <a key={k.id} href="#productos" className={`cat ${ph ? '' : 'nophoto'}`} onClick={() => setCat(k.id)}>
              {ph && <img src={ph} alt="" loading="lazy" />}
              <span><b>{k.name}</b><small>{ps.length} producto{ps.length === 1 ? '' : 's'} →</small></span>
            </a>
          );
        })}
      </section>

      <section className="sec" id="productos">
        <div className="sec-head">
          <div><span className="kicker">Catálogo</span><h2 className="display-2">Elige qué vas a personalizar</h2></div>
          <div className="chips" role="group" aria-label="Filtrar por categoría">
            <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>Todo</button>
            {catalog.categories.map((k) => <button key={k.id} className="chip" aria-pressed={cat === k.id} onClick={() => setCat(k.id)}>{k.name}</button>)}
          </div>
        </div>
        {prods.length ? <div className="grid2">{prods.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <Empty>No hay productos en esta categoría.</Empty>}
      </section>

      <section className="band">
        <div className="band-in">
          <div className="band-head"><span className="kicker">Cómo funciona</span><h2 className="display-2">Del archivo a tus manos en 4 pasos</h2></div>
          <ol className="how">
            <li><b>1</b><h3>Elige y personaliza</h3><p>Producto, material, técnica, color y tallas. El precio se calcula al instante.</p></li>
            <li><b>2</b><h3>Sube tu diseño</h3><p>Imagen, foto o solo un nombre. Si no tienes arte, lo diseñamos por {money(st.designFee)}.</p></li>
            <li><b>3</b><h3>Paga y aprueba</h3><p>{st.onlinePay ? 'Paga en línea con tarjeta u OXXO, o deja un anticipo por transferencia.' : `Confirma con el ${st.depositPct}% de anticipo.`} Te enviamos el arte para aprobar.</p></li>
            <li><b>4</b><h3>Recoge o recibe</h3><p>Producción en {st.normalDays} días hábiles. Recoges sin costo o te lo enviamos.</p></li>
          </ol>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="sec" id="galeria">
          <div className="sec-head">
            <div><span className="kicker">Galería</span><h2 className="display-2">Trabajos que hemos estampado</h2></div>
            <p className="muted sec-note">Toca una foto para personalizar ese producto.</p>
          </div>
          <div className="masonry">
            {gallery.slice(0, galShow).map((g) => (
              <Link key={g.src} to={`/producto/${g.p.id}`} className="gitem"><img src={g.src} alt={g.p.name} loading="lazy" /><span>{g.p.name}</span></Link>
            ))}
          </div>
          {gallery.length > galShow && (
            <div className="center"><button className="btn" onClick={() => setGalShow((n) => n + 16)}>Ver más fotos ({gallery.length - galShow})</button></div>
          )}
        </section>
      )}

      <section className="cta-end">
        <div>
          <h2 className="display-2">¿Pedido para tu empresa, promo o evento?</h2>
          <p>Desde {st.discounts?.[0]?.qty || 6} piezas hay descuento automático por volumen{topDiscount ? `, hasta ${topDiscount}%` : ''}.</p>
        </div>
        <a href="#productos" className="btn lg light">Armar mi pedido</a>
      </section>
    </>
  );
}
