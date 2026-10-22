/* ---------- print areas per product mold (viewBox 300x320): [x, y, w, h, side] ---------- */
const AREAS = {
  tee:     {frente:[113,100,74,92,'front'], espalda:[106,88,88,118,'back'], manga_izq:[50,80,26,24,'front'], manga_der:[224,80,26,24,'front']},
  hoodie:  {frente:[114,100,72,72,'front'], espalda:[102,92,96,120,'back'], manga_izq:[52,140,24,44,'front'], manga_der:[224,140,24,44,'front']},
  mug:     {frente:[96,112,100,118,'front'], reverso:[104,112,100,118,'back']},
  beer:    {frente:[102,118,88,104,'front']},
  tumbler: {frente:[114,124,72,112,'front'], reverso:[114,124,72,112,'back']},
  keychain:{frente:[106,112,88,126,'front'], reverso:[106,112,88,126,'back']},
  cap:     {frente:[120,118,60,46,'front'], lateral:[194,138,28,30,'front']},
  bag:     {frente:[100,150,100,110,'front'], reverso:[100,150,100,110,'back']}
};
const SHAPES = {tee:'Playera',hoodie:'Sudadera',mug:'Taza',beer:'Tarro de vidrio',tumbler:'Termo',keychain:'Llavero',cap:'Gorra',bag:'Tote bag'};
const AREA_NAMES = {frente:'Frente',espalda:'Espalda',reverso:'Reverso',manga_izq:'Manga izquierda',manga_der:'Manga derecha',lateral:'Lateral'};
const STATUSES = [
  ['recibido','Recibido','info'],['revision','Diseño en revisión','warn'],['aprobado','Aprobado','info'],
  ['produccion','En producción','accent'],['listo','Listo para entregar','ok'],['entregado','Entregado','muted'],['cancelado','Cancelado','bad']];
const PAY = {pendiente:['Pago pendiente','warn'],adelanto:['Anticipo recibido','info'],pagado:['Pagado','ok']};
const FONTS = {script:{label:'Manuscrita',family:'Caveat, cursive',scale:1.15},block:{label:'Bloque',family:'"Bebas Neue", Impact, sans-serif',scale:1.05},classic:{label:'Clásica',family:'Fraunces, Georgia, serif',scale:.85}};

/* ---------- state ---------- */
const S = {mode:'loading', catalog:null, cart:[], mine:[], allByUser:{}, view:'shop', cat:'all', isAdmin:false, canOrder:true,
  uid:null, admTab:'pedidos', admFilter:'activos', admQuery:'', cfg:null, side:'front', lastOrder:null, checkout:{delivery:'recojo',rush:false}};
const FILES = {}; // archivos originales en memoria mientras se arma el pedido
const app = document.getElementById('app');

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid = () => Math.random().toString(36).slice(2,10);
const cur = () => S.catalog?.settings?.currency || 'S/';
const money = n => { const c = cur(); return c + (c.length>1?' ':'') + (Math.round((Number(n)||0)*100)/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); };
const clone = o => JSON.parse(JSON.stringify(o));
const lsGet = (k,d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
const lsSet = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } };
const byId = (arr,id) => (arr||[]).find(x => x.id === id);
const fmtDate = t => t ? new Date(t).toLocaleDateString('es-MX',{day:'numeric',month:'short'}) : '—';
const fmtDateTime = t => t ? new Date(t).toLocaleString('es-MX',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
const statusMeta = k => STATUSES.find(s => s[0]===k) || STATUSES[0];
const pill = (label,tone) => `<span class="pill t-${tone}">${esc(label)}</span>`;
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2600); }
function addBusinessDays(d,n){ const x=new Date(d); let k=0; while(k<n){ x.setDate(x.getDate()+1); if(x.getDay()!==0) k++; } return x; }
function shade(hex,amt){ let h=(hex||'#ffffff').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
  const n=parseInt(h,16); let r=n>>16&255,g=n>>8&255,b=n&255;
  const f=v=>Math.max(0,Math.min(255,Math.round(amt<0? v*(1+amt) : v+(255-v)*amt)));
  return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function lum(hex){ let h=(hex||'#fff').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255; }
const PAW_SVG = `<svg class="paw" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><ellipse cx="18" cy="22" rx="7" ry="9"/><ellipse cx="32" cy="15" rx="7" ry="9"/><ellipse cx="46" cy="22" rx="7" ry="9"/><ellipse cx="52" cy="36" rx="6" ry="7.5"/><path d="M32 30c-9 0-17 9-17 17 0 6 5 9 10 8 3-.5 4.5-2 7-2s4 1.5 7 2c5 1 10-2 10-8 0-8-8-17-17-17z"/></svg>`;

/* ---------- mockups ---------- */
function silhouette(shape, fill, side){
  const e = shade(fill, lum(fill)>.5 ? -.22 : .28), d = shade(fill,-.12);
  const st = `stroke="${e}" stroke-width="2" stroke-linejoin="round"`;
  const sh = (p) => `<path d="${p}" fill="url(#shd)" opacity=".9"/>`;
  switch(shape){
    case 'tee': { const p = `M95 40 L130 28 Q150 ${side==='front'?50:36} 170 28 L205 40 L262 78 L238 124 L212 110 L212 292 Q150 298 88 292 L88 110 L62 124 L38 78 Z`;
      return `<path d="${p}" fill="${fill}" ${st}/>${sh(p)}<path d="M130 28 Q150 ${side==='front'?50:36} 170 28" fill="none" stroke="${e}" stroke-width="5" opacity=".5"/><path d="M88 110 L88 120 M212 110 L212 120" stroke="${e}" stroke-width="1.5" opacity=".5"/>`; }
    case 'hoodie': { const p = 'M98 54 L126 44 Q150 58 174 44 L202 54 L246 92 L266 236 L240 242 L220 134 L216 292 Q150 298 84 292 L80 134 L60 242 L34 236 L54 92 Z';
      const hood = side==='front' ? `<path d="M110 56 Q150 2 190 56 Z" fill="${d}" ${st}/>` : '';
      const top = side==='front'
        ? `<path d="M124 52 Q150 22 176 52 Q150 72 124 52Z" fill="${shade(fill,-.35)}"/><path d="M140 64 L138 104 M160 64 L162 104" stroke="${e}" stroke-width="2.5" stroke-linecap="round"/><path d="M110 218 L190 218 L200 266 L100 266 Z" fill="none" ${st} opacity=".8"/>`
        : `<path d="M108 60 Q150 0 192 60 Q150 82 108 60Z" fill="${d}" ${st}/>`;
      return `${hood}<path d="${p}" fill="${fill}" ${st}/>${sh(p)}${top}<path d="M84 280 Q150 286 216 280" fill="none" stroke="${e}" stroke-width="1.5" opacity=".6"/>`; }
    case 'mug': { const handle = side==='front' ? 'M214 122 C266 120 266 214 214 210' : 'M86 122 C34 120 34 214 86 210';
      const x = side==='front'?80:86;
      return `<path d="${handle}" fill="none" stroke="${e}" stroke-width="20" stroke-linecap="round"/><path d="${handle}" fill="none" stroke="${fill}" stroke-width="14" stroke-linecap="round"/>
        <rect x="${x}" y="86" width="136" height="166" rx="12" fill="${fill}" ${st}/><rect x="${x}" y="86" width="136" height="166" rx="12" fill="url(#shd)"/><ellipse cx="${x+68}" cy="88" rx="66" ry="8" fill="${shade(fill,-.3)}"/>`; }
    case 'beer': return `<path d="M200 118 C252 118 252 218 198 214" fill="none" stroke="var(--glass-e,#9FB9C2)" stroke-width="16" stroke-linecap="round" opacity=".7"/>
        <path d="M86 82 L206 82 L200 262 Q146 276 92 262 Z" fill="#D9ECF1" fill-opacity=".45" stroke="#9FB9C2" stroke-width="2.5"/>
        <path d="M108 96 L110 248 M136 96 L136 252 M164 96 L162 252 M190 96 L187 248" stroke="#9FB9C2" stroke-width="1.5" opacity=".55"/><ellipse cx="146" cy="83" rx="60" ry="6" fill="#C9E0E7" opacity=".7"/>`;
    case 'tumbler': { const p='M100 90 L200 90 L190 284 Q150 294 110 284 Z';
      return `<rect x="96" y="50" width="108" height="24" rx="7" fill="#DCE0E5" stroke="#AEB5BD" stroke-width="2"/><rect x="99" y="74" width="102" height="16" fill="#C3CAD1" stroke="#AEB5BD" stroke-width="2"/><path d="${p}" fill="${fill}" ${st}/>${sh(p)}`; }
    case 'keychain': return `<circle cx="150" cy="54" r="24" fill="none" stroke="#B4BAC2" stroke-width="6"/><rect x="141" y="76" width="18" height="26" rx="4" fill="#C8CDD3" stroke="#A9B0B8" stroke-width="1.5"/>
        <rect x="96" y="100" width="108" height="150" rx="18" fill="${fill==='#FFFFFF'?'#F4F7F9':fill}" stroke="#AEB8C0" stroke-width="2"/><rect x="96" y="100" width="108" height="150" rx="18" fill="url(#shd)"/>`;
    case 'cap': { const p='M70 196 Q66 92 150 86 Q234 92 230 196 Z';
      return `<path d="${p}" fill="${fill}" ${st}/>${sh(p)}<path d="M150 88 L150 196 M150 88 Q110 120 104 196 M150 88 Q190 120 196 196" fill="none" stroke="${e}" stroke-width="1.5" opacity=".55"/><circle cx="150" cy="88" r="6" fill="${d}" ${st}/>
        <path d="M56 194 Q150 226 244 194 L252 214 Q150 254 48 214 Z" fill="${d}" ${st}/>`; }
    case 'bag': { const p='M76 110 L224 110 L224 292 L76 292 Z';
      return `<path d="M116 112 Q116 46 150 46 Q184 46 184 112" fill="none" stroke="${e}" stroke-width="10" stroke-linecap="round"/><path d="M116 112 Q116 46 150 46 Q184 46 184 112" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round"/><path d="${p}" fill="${fill}" ${st}/>${sh(p)}`; }
  }
  return '';
}
function mockSVG(it, side='front', opts={}){
  const shape = it.shape, fill = it.color?.hex || '#FFFFFF', A = AREAS[shape]||{};
  const guideStroke = lum(shape==='beer'?'#ffffff':fill)>.5 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.6)';
  let out = '';
  for (const [k,a] of Object.entries(A)){
    if (a[4] !== side) continue;
    const [x,y,w,h] = a; const z = (it.zones||[]).find(z => z.key===k);
    if (z){
      if (z.img) out += `<image href="${z.img}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
      const hasText = it.text && it.textZone===k;
      if (hasText){
        const f = FONTS[it.textFont]||FONTS.script; const t = it.text.slice(0,40);
        const size = Math.max(7, Math.min(h*.42, (w/(Math.max(3,t.length)*.52))*f.scale));
        const ty = z.img ? y+h-4 : y+h/2+size*.35;
        out += `<text x="${x+w/2}" y="${ty}" text-anchor="middle" font-family='${f.family}' font-size="${size.toFixed(1)}" fill="${esc(it.textColor||'#1E1D22')}">${esc(t)}</text>`;
      }
      if (!z.img && !hasText) out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${guideStroke}" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="${Math.min(12,w/5)}" font-family="Figtree,sans-serif" font-weight="700" fill="${guideStroke}">${w>40?'TU DISEÑO':'+'}</text>`;
    } else if (opts.guides){
      out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${guideStroke}" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>`;
    }
  }
  if (opts.sample && A.frente && side==='front'){
    const [x,y,w,h] = A.frente; const s = Math.min(w,h)*.7;
    out += `<g transform="translate(${x+w/2-s/2} ${y+h/2-s/2}) scale(${s/64})" fill="${lum(fill)>.5||shape==='beer'?'#EA5F1C':'#FFB547'}"><ellipse cx="18" cy="22" rx="7" ry="9"/><ellipse cx="32" cy="15" rx="7" ry="9"/><ellipse cx="46" cy="22" rx="7" ry="9"/><ellipse cx="52" cy="36" rx="6" ry="7.5"/><path d="M32 30c-9 0-17 9-17 17 0 6 5 9 10 8 3-.5 4.5-2 7-2s4 1.5 7 2c5 1 10-2 10-8 0-8-8-17-17-17z"/></g>`;
  }
  return `<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(SHAPES[shape]||'Producto')}"><defs><linearGradient id="shd" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".10"/><stop offset=".3" stop-color="#fff" stop-opacity=".10"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>${silhouette(shape, fill, side)}${out}</svg>`;
}
function hasBack(shape){ return Object.values(AREAS[shape]||{}).some(a => a[4]==='back'); }

/* ---------- pricing ---------- */
function productParts(p, cfg){
  const cat = S.catalog; const mat = byId(cat.materials, cfg.mat); const tech = byId(cat.techniques, cfg.tech);
  const zones = (p.zones||[]).filter(z => cfg.zones[z.key]?.on);
  const unit = Number(p.base||0) + Number(mat?.add||0) + Number(tech?.add||0) + zones.reduce((s,z)=>s+Number(z.extra||0),0);
  const qty = p.useSizes ? Object.values(cfg.sizes||{}).reduce((s,n)=>s+(Number(n)||0),0) : Number(cfg.qty)||0;
  const design = cfg.designHelp ? Number(cat.settings.designFee||0) : 0;
  return {mat, tech, zones, unit, qty, design, line: unit*qty + design};
}
function totals(items, opt){
  const st = S.catalog?.settings || {}; const sub = items.reduce((s,i)=>s+i.line,0); const qty = items.reduce((s,i)=>s+i.qty,0);
  const tier = (st.discounts||[]).filter(t => qty >= Number(t.qty)).sort((a,b)=>b.pct-a.pct)[0];
  const disc = tier ? sub*Number(tier.pct)/100 : 0;
  const rush = opt?.rush ? (sub-disc)*Number(st.rushPct||0)/100 : 0;
  const ship = opt?.delivery==='delivery' ? Number(st.deliveryFee||0) : 0;
  const total = sub - disc + rush + ship;
  return {sub, qty, tier, disc, rush, ship, total, deposit: total*Number(st.depositPct||0)/100};
}
function nextTier(qty){ return (S.catalog?.settings?.discounts||[]).filter(t=>Number(t.qty)>qty).sort((a,b)=>a.qty-b.qty)[0]; }

/* ---------- data layer (todo se guarda en localStorage) ---------- */
function init(){
  S.cart = lsGet('printly_cart', []);
  const v = (location.hash||'').slice(1); if (['shop','carrito','pedidos','admin'].includes(v)) S.view = v==='carrito'?'cart':v==='pedidos'?'orders':v;
  loadData();
}
function loadData(){
  S.mode = 'demo'; S.isAdmin = true; S.canOrder = true;
  const stored = lsGet('printly_catalog', null);
  S.catalog = stored && (stored.version||1) >= (DEFAULT_CATALOG.version||1) ? stored : clone(DEFAULT_CATALOG);
  S.mine = lsGet('printly_orders', []);
  S.allByUser = {demo: S.mine.map(o=>({...o,_uid:'demo'}))};
  render();
}
function allOrders(){ return Object.values(S.allByUser).flat().sort((a,b)=>b.createdAt-a.createdAt); }
async function saveCatalog(cat){
  S.catalog = cat;
  if (!lsSet('printly_catalog', cat)) toast('El navegador no permitió guardar los cambios.');
  render(); return true;
}
async function createOrder(o){
  S.mine = [o, ...S.mine];
  if (!lsSet('printly_orders', S.mine)) { S.mine = S.mine.slice(1); throw new Error('storage'); }
  S.allByUser = {demo: S.mine.map(x=>({...x,_uid:'demo'}))};
}
async function patchOrder(o, patch){
  S.mine = S.mine.map(x => x.id===o.id ? {...x, ...patch} : x); lsSet('printly_orders', S.mine);
  S.allByUser = {demo: S.mine.map(x=>({...x,_uid:'demo'}))};
}
function saveCart(){ if (!lsSet('printly_cart', S.cart)) { /* storage full or blocked: cart lives in memory */ } }

/* ---------- render ---------- */
function softRender(){
  const a = document.activeElement;
  if (a && app.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { S._dirty = true; return; }
  render();
}
function render(){
  S._dirty = false;
  renderNav(); renderBanner();
  if (S.mode==='loading') { app.innerHTML = `<div class="empty">${PAW_SVG}<p class="muted">Cargando la tienda…</p></div>`; return; }
  if (!S.catalog) { app.innerHTML = noCatalog(); return; }
  const v = S.view;
  renderFooter();
  app.innerHTML = v==='custom' ? viewCustom() : v==='cart' ? viewCart() : v==='orders' ? viewOrders() : v==='done' ? viewDone() : v==='admin' && S.isAdmin ? viewAdmin() : viewShop();
}
function renderNav(){
  const n = S.cart.reduce((s,i)=>s+i.qty,0);
  const cur = S.view==='custom'?'shop':S.view==='done'?'orders':S.view;
  const b = (v,l) => `<button data-act="go" data-view="${v}" ${cur===v?'aria-current="page"':''}>${l}</button>`;
  document.getElementById('nav').innerHTML = b('shop','Tienda') + b('orders','Mis pedidos') + (S.isAdmin ? b('admin','Administrar') : '') +
    `<button class="cartbtn" data-act="go" data-view="cart" ${cur==='cart'?'aria-current="page"':''}>Carrito <span class="badge num">${n}</span></button>`;
}
function renderBanner(){
  document.getElementById('banner').innerHTML = `<div class="banner"><div class="wrap"><span class="dot"></span><span><b>Versión demo.</b> Haz pedidos de prueba y entra a Administrar: todo se guarda solo en este navegador.</span></div></div>`;
}
function renderFooter(){
  const st = S.catalog?.settings || {}; const el = document.getElementById('foot'); if (!el) return;
  el.innerHTML = `<div class="wrap foot-in">
    <div class="foot-brand"><img src="img/logo.webp" alt="Printly"><p>Estampados personalizados en playeras, sudaderas, tazas, termos, tarros y accesorios. Desde una pieza. Envíos a todo México.</p></div>
    <div><h4>Tienda</h4><button data-act="go" data-view="shop">Productos</button><button data-act="scrollto" data-to="galeria">Galería</button><button data-act="go" data-view="orders">Mis pedidos</button></div>
    <div><h4>Contacto</h4>${st.whatsapp?`<span>WhatsApp <b class="num">${esc(st.whatsapp)}</b></span>`:'<span>WhatsApp: configúralo en Ajustes</span>'}${st.pickupAddress?`<span>${esc(st.pickupAddress)}</span>`:''}<span>Pagos: ${esc((st.payMethods||[]).slice(0,3).join(', '))}</span></div>
  </div><div class="wrap foot-legal">© ${new Date().getFullYear()} ${esc(st.shopName||'Printly')}</div>`;
}
function noCatalog(){
  return `<div class="empty">${PAW_SVG}<h2>La tienda aún no tiene catálogo</h2>
    <p class="muted">Cuando el equipo cargue los productos, aparecerán aquí.</p>
    ${S.isAdmin ? `<button class="btn primary" data-act="seed">Cargar catálogo inicial</button>` : ''}</div>`;
}

/* ---- shop ---- */
const photoOf = (p,i=0) => (p.photos||[])[i];
function minPrice(p){ return Number(p.base) + Math.min(0, ...p.mats.map(m => Number(byId(S.catalog.materials,m)?.add||0))); }
function productCard(p){
  const c = S.catalog; const ph = p.photos||[]; const col = byId(c.colors, p.colors[0]);
  return `<article class="pcard2">
    <button class="pimg ${ph[0]?'':'nophoto'}" data-act="open" data-pid="${esc(p.id)}" aria-label="Personalizar ${esc(p.name)}">
      ${ph[0] ? `<img src="${esc(ph[0])}" alt="${esc(p.name)}" loading="lazy">${ph[1]?`<img class="alt" src="${esc(ph[1])}" alt="" loading="lazy">`:''}` : `<div class="svgwrap">${mockSVG({shape:p.shape,color:col,zones:[]},'front',{sample:true})}</div>`}
      ${p.badge?`<span class="tag">${esc(p.badge)}</span>`:''}
      ${ph.length>1?`<span class="count">${ph.length} fotos</span>`:''}
    </button>
    <div class="pinfo">
      <div class="prow"><h3>${esc(p.name)}</h3><span class="price">desde <b class="num">${money(minPrice(p))}</b></span></div>
      <p>${esc(p.desc)}</p>
      <div class="pfoot">${p.colors.length>1 ? `<div class="dots" aria-label="${p.colors.length} colores">${p.colors.slice(0,6).map(id => `<i style="background:${esc(byId(c.colors,id)?.hex)}"></i>`).join('')}${p.colors.length>6?`<small>+${p.colors.length-6}</small>`:''}</div>` : `<span class="muted mats">${esc(p.mats.map(m=>byId(c.materials,m)?.name).filter(Boolean).join(' · '))}</span>`}
      <button class="btn primary sm" data-act="open" data-pid="${esc(p.id)}">Personalizar</button></div>
    </div></article>`;
}
function viewShop(){
  const c = S.catalog, st = c.settings;
  const active = c.products.filter(p => p.active);
  const prods = active.filter(p => S.cat==='all' || p.cat===S.cat);
  const withPh = active.filter(p => photoOf(p));
  const hero = withPh.slice(0,3);
  const fromAll = active.length ? Math.min(...active.map(minPrice)) : 0;
  const gallery = active.flatMap(p => (p.photos||[]).map((src,i) => ({src, p, i})));
  // interleave products so the gallery mixes categories
  const mixed = []; const byP = active.map(p => gallery.filter(g => g.p===p)); for (let i=0; byP.some(l=>l[i]); i++) byP.forEach(l => l[i] && mixed.push(l[i]));
  return `
  <section class="hero2">
    <div class="hero-copy">
      <span class="kicker">Estampados personalizados · desde 1 pieza</span>
      <h1 class="display">Tu idea, <em>estampada</em> en lo que quieras.</h1>
      <p class="lead">Playeras, sudaderas, tazas, termos, tarros y llaveros con tu diseño, tu foto o tu nombre. Lo armas aquí y ves cómo queda antes de pedir.</p>
      <div class="cta"><button class="btn primary lg" data-act="scrollto" data-to="productos">Personalizar ahora</button><button class="btn lg" data-act="scrollto" data-to="galeria">Ver trabajos</button></div>
      <ul class="trust">
        <li><b>Arte para aprobar</b><span>Antes de imprimir</span></li>
        <li><b>${esc(st.normalDays)} días hábiles</b><span>O ${esc(st.rushDays)} con urgencia</span></li>
        <li><b>${esc(st.depositPct)}% de anticipo</b><span>${esc((st.payMethods||[]).slice(0,2).join(' o '))}</span></li>
      </ul>
    </div>
    <div class="collage">
      ${hero.map((p,i) => `<button class="ph ph${i+1}" data-act="open" data-pid="${esc(p.id)}" aria-label="${esc(p.name)}"><img src="${esc(photoOf(p))}" alt="${esc(p.name)} personalizado"><span>${esc(p.name)}</span></button>`).join('')}
      <span class="sticker" aria-hidden="true">desde<b>${money(fromAll)}</b></span>
    </div>
  </section>

  <section class="cats" aria-label="Categorías">
    ${c.categories.map(k => { const ps = active.filter(p => p.cat===k.id); const ph = ps.map(p => photoOf(p, p.photos?.length>2?2:0)).find(Boolean);
      return `<button class="cat ${ph?'':'nophoto'}" data-act="catgo" data-cat="${esc(k.id)}">${ph?`<img src="${esc(ph)}" alt="" loading="lazy">`:''}<span><b>${esc(k.name)}</b><small>${ps.length} producto${ps.length===1?'':'s'} →</small></span></button>`; }).join('')}
  </section>

  <section class="sec" id="productos">
    <div class="sec-head"><div><span class="kicker">Catálogo</span><h2 class="display-2">Elige qué vas a personalizar</h2></div>
      <div class="chips" role="group" aria-label="Filtrar por categoría">
        <button class="chip" data-act="cat" data-cat="all" aria-pressed="${S.cat==='all'}">Todo</button>
        ${c.categories.map(k => `<button class="chip" data-act="cat" data-cat="${esc(k.id)}" aria-pressed="${S.cat===k.id}">${esc(k.name)}</button>`).join('')}
      </div></div>
    ${prods.length ? `<div class="grid2">${prods.map(productCard).join('')}</div>` : `<div class="empty muted">No hay productos en esta categoría.</div>`}
  </section>

  <section class="band">
    <div class="band-in">
      <div class="band-head"><span class="kicker">Cómo funciona</span><h2 class="display-2">Del archivo a tus manos en 4 pasos</h2></div>
      <ol class="how">
        <li><b>1</b><h3>Elige y personaliza</h3><p>Producto, material, técnica, color y tallas. El precio se calcula al instante.</p></li>
        <li><b>2</b><h3>Sube tu diseño</h3><p>Imagen, foto o solo un nombre. Si no tienes arte, lo diseñamos por ${money(st.designFee)}.</p></li>
        <li><b>3</b><h3>Aprueba y paga el anticipo</h3><p>Te enviamos el arte final por WhatsApp y confirmas con el ${esc(st.depositPct)}%.</p></li>
        <li><b>4</b><h3>Recoge o recibe</h3><p>Producción en ${esc(st.normalDays)} días hábiles. Recoges sin costo o te lo enviamos.</p></li>
      </ol>
    </div>
  </section>

  ${mixed.length ? `<section class="sec" id="galeria">
    <div class="sec-head"><div><span class="kicker">Galería</span><h2 class="display-2">Trabajos que hemos estampado</h2></div><p class="muted sec-note">Toca una foto para personalizar ese producto.</p></div>
    <div class="masonry">${mixed.map(g => `<button class="gitem" data-act="open" data-pid="${esc(g.p.id)}"><img src="${esc(g.src)}" alt="${esc(g.p.name)}" loading="lazy"><span>${esc(g.p.name)}</span></button>`).join('')}</div>
  </section>` : ''}

  <section class="cta-end">
    <div><h2 class="display-2">¿Pedido para tu empresa, promo o evento?</h2><p>Desde ${esc(st.discounts?.[0]?.qty||6)} unidades hay descuento automático por volumen${st.discounts?.length?`, hasta ${Math.max(...st.discounts.map(d=>d.pct))}%`:''}.</p></div>
    <button class="btn lg light" data-act="scrollto" data-to="productos">Armar mi pedido</button>
  </section>`;
}

/* ---- customizer ---- */
function newCfg(p){
  const c = S.catalog; const mat = byId(c.materials, p.mats[0]);
  const techs = (mat?.techs||[]).filter(t => byId(c.techniques,t));
  const zones = {}; (p.zones||[]).forEach((z,i) => zones[z.key] = {on: i===0});
  const sizes = {}; if (p.useSizes) (p.sizes||[]).forEach(s => sizes[s] = 0);
  if (p.useSizes && p.sizes?.length) sizes[p.sizes.includes('M')?'M':p.sizes[0]] = 1;
  return {pid:p.id, mat:mat?.id, tech:techs[0], color:p.colors[0]||null, zones, sizes, qty: Math.max(1, Number(p.minQty)||1),
    text:'', textFont:'script', textZone:(p.zones?.[0]?.key)||'frente', textColor:'#1E1D22', notes:'', designHelp:false};
}
function cfgItem(p, cfg){
  const c = S.catalog; const col = byId(c.colors, cfg.color);
  return {shape:p.shape, color: col ? {name:col.name, hex:col.hex} : null,
    zones: (p.zones||[]).filter(z => cfg.zones[z.key]?.on).map(z => ({key:z.key, label:z.label, img:cfg.zones[z.key].img||null})),
    text: cfg.text, textFont: cfg.textFont, textZone: cfg.textZone, textColor: cfg.textColor};
}
function viewCustom(){
  const c = S.catalog, cfg = S.cfg, p = byId(c.products, cfg?.pid);
  if (!p) { S.view='shop'; return viewShop(); }
  const parts = productParts(p, cfg); const mat = parts.mat;
  const techs = (mat?.techs||[]).map(t => byId(c.techniques,t)).filter(Boolean);
  const item = cfgItem(p, cfg); const back = hasBack(p.shape);
  const sideZones = side => (p.zones||[]).filter(z => AREAS[p.shape]?.[z.key]?.[4]===side);
  return `
  <button class="btn ghost sm back" data-act="go" data-view="shop">← Volver al catálogo</button>
  <div class="cust">
    <div class="preview" aria-live="polite">
      ${back ? `<div class="sidetabs"><button class="chip" data-act="side" data-side="front" aria-pressed="${S.side==='front'}">Vista frontal</button><button class="chip" data-act="side" data-side="back" aria-pressed="${S.side==='back'}">Vista posterior</button></div>`:''}
      <div id="mock">${mockSVG(item, back?S.side:'front', {guides:true})}</div>
      <p class="muted" style="font-size:12.5px;text-align:center">Vista referencial. Antes de imprimir te enviamos el arte final para aprobar.</p>
      ${(p.photos||[]).length ? `<div class="pgal"><span class="kicker">Trabajos reales</span><div class="thumbs">${p.photos.map((src,i) => `<button data-act="viewphoto" data-pid="${esc(p.id)}" data-i="${i}" aria-label="Ver foto ${i+1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div></div>` : ''}
    </div>
    <div class="panel">
      <div><div class="eyebrow">${esc(byId(c.categories,p.cat)?.name||'')}</div><h2 style="margin-top:6px">${esc(p.name)}</h2><p class="muted" style="margin-top:6px">${esc(p.desc)}</p></div>

      <section class="step"><h3>Material <small>${p.mats.length} opciones</small></h3>
        <div class="opts">${p.mats.map(id => { const m = byId(c.materials,id); if(!m) return '';
          return `<button class="opt" data-act="mat" data-id="${esc(m.id)}" aria-pressed="${cfg.mat===m.id}"><b>${esc(m.name)}</b><span>${esc(m.desc)}</span>${Number(m.add)?`<em>${m.add>0?'+':'−'}${money(Math.abs(m.add))}</em>`:''}</button>`; }).join('')}</div></section>

      <section class="step"><h3>Técnica de impresión</h3>
        <div class="opts">${techs.map(t => `<button class="opt" data-act="tech" data-id="${esc(t.id)}" aria-pressed="${cfg.tech===t.id}"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span>${Number(t.add)?`<em>+${money(t.add)} c/u</em>`:''}</button>`).join('') || '<p class="muted">Este material no tiene técnicas configuradas.</p>'}</div></section>

      ${p.colors.length ? `<section class="step"><h3>Color <small>${esc(byId(c.colors,cfg.color)?.name||'')}</small></h3>
        <div class="swatches">${p.colors.map(id => { const k = byId(c.colors,id); if(!k) return '';
          return `<button class="sw" data-act="color" data-id="${esc(k.id)}" aria-pressed="${cfg.color===k.id}" title="${esc(k.name)}" aria-label="${esc(k.name)}" style="background:${esc(k.hex)}"></button>`; }).join('')}</div></section>`:''}

      <section class="step"><h3>Zonas de impresión y diseño</h3>
        ${(p.zones||[]).map(z => { const zc = cfg.zones[z.key]||{}; const lowres = zc.img && Math.max(zc.w||0, zc.h||0) < 1200;
          return `<div class="zone">
            <label class="chk"><input type="checkbox" data-act="zone" data-key="${esc(z.key)}" ${zc.on?'checked':''} aria-label="${esc(z.label)}"></label>
            <div class="meta"><b>${esc(z.label)} ${Number(z.extra)?`<span class="muted" style="font-weight:500">+${money(z.extra)}</span>`:''}</b>
              ${zc.img ? `<span class="file">${esc(zc.name)} · ${zc.w}×${zc.h}px</span>${lowres?'<span class="warn">Resolución baja: podría verse pixelado</span>':''}` : `<span class="file">${zc.on ? 'Sube PNG o JPG, ideal 3000 px y fondo transparente' : 'No incluida'}</span>`}</div>
            <div class="zone-actions">
              ${zc.img ? `<div class="thumb"><img src="${zc.img}" alt=""></div><button class="btn sm ghost" data-act="rmimg" data-key="${esc(z.key)}">Quitar</button>` : ''}
              <span class="btn sm upl">${zc.img?'Cambiar':'Subir imagen'}<input type="file" accept="image/*" data-up="${esc(z.key)}" aria-label="Subir imagen para ${esc(z.label)}"></span>
            </div></div>`; }).join('')}
        <label class="chk"><input type="checkbox" data-act="designhelp" ${cfg.designHelp?'checked':''}> Quiero que Printly diseñe el arte por mí (+${money(c.settings.designFee)} por modelo)</label>
      </section>

      <section class="step"><h3>Texto o nombre <small>opcional</small></h3>
        <div class="row">
          <label class="f">Texto<input type="text" id="t-text" maxlength="40" placeholder="Ej. Aldair" value="${esc(cfg.text)}" data-in="text"></label>
          <label class="f">Estilo<select id="t-font" data-in="textFont">${Object.entries(FONTS).map(([k,f])=>`<option value="${k}" ${cfg.textFont===k?'selected':''}>${f.label}</option>`).join('')}</select></label>
        </div>
        <div class="row">
          <label class="f">Ubicación<select id="t-zone" data-in="textZone">${(p.zones||[]).map(z=>`<option value="${esc(z.key)}" ${cfg.textZone===z.key?'selected':''}>${esc(z.label)}</option>`).join('')}</select></label>
          <label class="f">Color del texto<input type="color" id="t-color" value="${esc(cfg.textColor)}" data-in="textColor" style="height:40px;padding:3px;border:1px solid var(--line);border-radius:9px;width:100%;background:var(--surface)"></label>
        </div>
      </section>

      <section class="step"><h3>${p.useSizes ? 'Tallas y cantidades' : 'Cantidad'}</h3>
        ${p.useSizes ? `<div class="sizes">${(p.sizes||[]).map(s => `<label for="sz-${s}">${esc(s)}<input type="number" id="sz-${s}" min="0" inputmode="numeric" value="${cfg.sizes[s]||0}" data-size="${esc(s)}"></label>`).join('')}</div>`
          : `<div class="row"><label class="f" style="max-width:160px">Unidades<input type="number" id="qty" min="1" inputmode="numeric" value="${cfg.qty}" data-in="qty"></label></div>`}
        ${Number(p.minQty)>1?`<p class="muted" style="font-size:13px">Pedido mínimo: ${esc(p.minQty)} unidades.</p>`:''}
        <label class="f">Indicaciones para el equipo<textarea id="notes" data-in="notes" placeholder="Tamaño del estampado, colores exactos, referencia…">${esc(cfg.notes)}</textarea></label>
      </section>

      <div class="pricebox" id="pricebox">${priceBox(p, cfg)}</div>
    </div>
  </div>`;
}
function priceBox(p, cfg){
  const r = productParts(p, cfg); const cartQty = S.cart.reduce((s,i)=>s+i.qty,0) + (cfg.editKey?0:r.qty);
  const nt = nextTier(cartQty); const err = validateCfg(p, cfg, r);
  return `
    <div class="line"><span>Precio por unidad</span><span class="num">${money(r.unit)}</span></div>
    <div class="line"><span>Unidades</span><span class="num">× ${r.qty}</span></div>
    ${r.design?`<div class="line"><span>Diseño por Printly</span><span class="num">${money(r.design)}</span></div>`:''}
    <div class="line total"><span>Subtotal</span><span class="num">${money(r.line)}</span></div>
    ${nt ? `<p class="tiers">Lleva ${nt.qty - cartQty} unidad${nt.qty-cartQty===1?'':'es'} más en tu pedido y obtén ${nt.pct}% de descuento.</p>` : ''}
    ${err ? `<p class="err">${esc(err)}</p>`:''}
    <button class="btn primary block" data-act="addcart" ${err?'disabled':''}>${cfg.editKey?'Guardar cambios':'Agregar al carrito'}</button>`;
}
function validateCfg(p, cfg, r){
  if (!r.zones.length) return 'Elige al menos una zona de impresión.';
  if (!cfg.tech) return 'Elige una técnica de impresión.';
  if (r.qty < Math.max(1, Number(p.minQty)||1)) return p.minQty>1 ? `El mínimo es ${p.minQty} unidades.` : 'Indica al menos 1 unidad.';
  if (!cfg.designHelp){ const missing = r.zones.find(z => !cfg.zones[z.key].img && !(cfg.text && cfg.textZone===z.key));
    if (missing) return `Sube una imagen para "${missing.label}", escribe un texto ahí o pide que diseñemos por ti.`; }
  return '';
}
function refreshCustom(){
  const p = byId(S.catalog.products, S.cfg.pid); const back = hasBack(p.shape);
  const m = document.getElementById('mock'); if (m) m.innerHTML = mockSVG(cfgItem(p,S.cfg), back?S.side:'front', {guides:true});
  const pb = document.getElementById('pricebox'); if (pb) pb.innerHTML = priceBox(p, S.cfg);
}
function compressImage(file, max=900){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => { const img = new Image();
      img.onload = () => { const s = Math.min(1, max/Math.max(img.width, img.height)); const cv = document.createElement('canvas');
        cv.width = Math.max(1,Math.round(img.width*s)); cv.height = Math.max(1,Math.round(img.height*s)); cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
        let d = cv.toDataURL('image/webp', .8); if (!d.startsWith('data:image/webp')) d = cv.toDataURL('image/png');
        res({img:d, w:img.width, h:img.height}); };
      img.onerror = () => rej(new Error('No pudimos leer esa imagen.')); img.src = fr.result; };
    fr.onerror = () => rej(new Error('No pudimos leer el archivo.')); fr.readAsDataURL(file);
  });
}
function addToCart(){
  const c = S.catalog, cfg = S.cfg, p = byId(c.products, cfg.pid); const r = productParts(p, cfg);
  if (validateCfg(p,cfg,r)) return;
  const key = cfg.editKey || rid();
  const item = {key, pid:p.id, name:p.name, shape:p.shape, cfg: clone({...cfg, editKey:undefined}),
    mat:{id:r.mat?.id, name:r.mat?.name}, tech:{id:r.tech?.id, name:r.tech?.name},
    color: byId(c.colors,cfg.color) ? {name:byId(c.colors,cfg.color).name, hex:byId(c.colors,cfg.color).hex} : null,
    zones: r.zones.map(z => ({key:z.key, label:z.label, img:cfg.zones[z.key].img||null, name:cfg.zones[z.key].name||null, w:cfg.zones[z.key].w||null, h:cfg.zones[z.key].h||null})),
    sizes: p.useSizes ? Object.fromEntries(Object.entries(cfg.sizes).filter(([,n])=>Number(n)>0).map(([s,n])=>[s,Number(n)])) : null,
    qty:r.qty, text:cfg.text, textFont:cfg.textFont, textZone:cfg.textZone, textColor:cfg.textColor, notes:cfg.notes,
    designHelp:cfg.designHelp, unit:r.unit, design:r.design, line:r.line};
  const i = S.cart.findIndex(x => x.key===key); if (i>=0) S.cart[i] = item; else S.cart.push(item);
  for (const z of item.zones){ const f = FILES[`cfg:${z.key}`]; if (f) FILES[`${key}:${z.key}`] = f; }
  saveCart(); S.view='cart'; render(); window.scrollTo(0,0); toast(cfg.editKey?'Producto actualizado':'Agregado al carrito');
}

/* ---- cart & checkout ---- */
function viewCart(){
  const st = S.catalog.settings; const ck = S.checkout;
  if (!S.cart.length) return `<div class="empty">${PAW_SVG}<h2>Tu carrito está vacío</h2><p class="muted">Elige un producto y personalízalo.</p><button class="btn primary" data-act="go" data-view="shop">Ver productos</button></div>`;
  const t = totals(S.cart, ck);
  const ready = addBusinessDays(new Date(), ck.rush ? Number(st.rushDays) : Number(st.normalDays));
  return `<h1 style="margin-bottom:20px">Tu pedido</h1>
  <div class="two">
    <div class="card">${S.cart.map(i => `
      <div class="citem">
        <div class="mini">${mockSVG(i,'front')}</div>
        <div style="display:grid;gap:4px;min-width:0"><h3>${esc(i.name)}</h3>
          <div class="d"><span>${esc(i.mat.name)} · ${esc(i.tech.name)}${i.color?` · ${esc(i.color.name)}`:''}</span>
          <span>Zonas: ${i.zones.map(z=>esc(z.label)).join(', ')}</span>
          ${i.sizes ? `<span>Tallas: ${Object.entries(i.sizes).map(([s,n])=>`${esc(s)}×${n}`).join(' · ')}</span>` : `<span>${i.qty} unidad${i.qty===1?'':'es'}</span>`}
          ${i.text?`<span>Texto: “${esc(i.text)}”</span>`:''}${i.designHelp?'<span>Diseño a cargo de Printly</span>':''}</div>
          <div style="display:flex;gap:6px;margin-top:4px"><button class="btn sm" data-act="editcart" data-key="${esc(i.key)}">Editar</button><button class="btn sm ghost danger" data-act="rmcart" data-key="${esc(i.key)}">Quitar</button></div>
        </div>
        <div class="num" style="font-weight:700;white-space:nowrap">${money(i.line)}</div>
      </div>`).join('')}
    </div>
    <form class="card" id="checkout" style="display:grid;gap:14px" novalidate>
      <h3>Datos de entrega</h3>
      <label class="f">Nombre completo<input type="text" id="c-name" name="name" required autocomplete="name"></label>
      <div class="row"><label class="f">Celular / WhatsApp<input type="tel" id="c-phone" name="phone" required autocomplete="tel" placeholder="55 1234 5678"></label>
      <label class="f">Correo <span class="hint">opcional</span><input type="email" id="c-email" name="email" autocomplete="email"></label></div>
      <div class="radio-cards">
        <button type="button" class="opt" data-act="delivery" data-v="recojo" aria-pressed="${ck.delivery==='recojo'}"><b>Recoger en tienda</b><span>${esc(st.pickupAddress||'Te confirmamos la dirección por WhatsApp')}</span><em>Gratis</em></button>
        <button type="button" class="opt" data-act="delivery" data-v="delivery" aria-pressed="${ck.delivery==='delivery'}"><b>Envío a domicilio</b><span>${esc(st.deliveryNote)}</span><em>${money(st.deliveryFee)}</em></button>
      </div>
      ${ck.delivery==='delivery' ? `<label class="f">Calle, número, colonia, C.P. y ciudad<input type="text" id="c-addr" name="address" required autocomplete="street-address"></label>`:''}
      <label class="f">Método de pago<select id="c-pay" name="pay">${(st.payMethods||[]).map(m=>`<option>${esc(m)}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" data-act="rush" ${ck.rush?'checked':''}> Pedido urgente: listo en ${esc(st.rushDays)} días hábiles (+${esc(st.rushPct)}%)</label>
      <div style="display:grid;gap:7px">
        <div class="line"><span>Subtotal (${t.qty} u.)</span><span class="num">${money(t.sub)}</span></div>
        ${t.disc?`<div class="line" style="color:var(--ok)"><span>Descuento por volumen ${t.tier.pct}%</span><span class="num">−${money(t.disc)}</span></div>`:''}
        ${t.rush?`<div class="line"><span>Urgencia</span><span class="num">${money(t.rush)}</span></div>`:''}
        ${t.ship?`<div class="line"><span>Envío</span><span class="num">${money(t.ship)}</span></div>`:''}
        <div class="line total"><span>Total</span><span class="num">${money(t.total)}</span></div>
        <div class="line"><span>Anticipo para confirmar (${esc(st.depositPct)}%)</span><span class="num" style="font-weight:700">${money(t.deposit)}</span></div>
        <p class="muted" style="font-size:13px">Fecha estimada: ${ready.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}, contada desde que apruebas el arte. Precios en pesos mexicanos con IVA incluido.</p>
      </div>
      <p class="err" id="c-err" hidden></p>
      <button class="btn primary block" type="submit" ${S.canOrder?'':'disabled'} id="c-submit">Enviar pedido</button>
    </form>
  </div>`;
}
async function submitOrder(form){
  const errEl = document.getElementById('c-err'); const fd = new FormData(form); const ck = S.checkout;
  const name = (fd.get('name')||'').trim(), phone = (fd.get('phone')||'').trim(), address = (fd.get('address')||'').trim();
  const fail = m => { errEl.textContent = m; errEl.hidden = false; };
  if (!name) return fail('Escribe tu nombre para saber a quién entregar.');
  if (phone.replace(/\D/g,'').length < 10) return fail('Escribe un celular de 10 dígitos para coordinar por WhatsApp.');
  if (ck.delivery==='delivery' && !address) return fail('Escribe la dirección de entrega.');
  errEl.hidden = true; const btn = document.getElementById('c-submit'); btn.disabled = true; btn.textContent = 'Enviando…';
  const st = S.catalog.settings; const t = totals(S.cart, ck); const now = Date.now(); const d = new Date();
  const id = rid(); const code = `PR-${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
  const items = [];
  for (const i of S.cart){
    const zones = [];
    for (const z of i.zones){
      const zz = {key:z.key, label:z.label, img:z.img, name:z.name, w:z.w, h:z.h};
      zones.push(zz);
    }
    const {cfg, key, ...rest} = i; items.push({...rest, zones});
  }
  const order = {id, code, createdAt:now, customer:{name, phone, email:(fd.get('email')||'').trim()}, delivery:ck.delivery, address,
    payMethod: fd.get('pay'), rush: ck.rush, items, sub:t.sub, disc:t.disc, discPct:t.tier?.pct||0, rushFee:t.rush, ship:t.ship, total:t.total, deposit:t.deposit,
    paid:0, payStatus:'pendiente', status:'recibido', history:[{status:'recibido', at:now}],
    dueDate: addBusinessDays(new Date(), ck.rush?Number(st.rushDays):Number(st.normalDays)).toISOString().slice(0,10), adminNotes:''};
  try { await createOrder(order); }
  catch(e){ btn.disabled=false; btn.textContent='Enviar pedido'; return fail('El navegador se quedó sin espacio para guardar el pedido. Restablece los datos de prueba en Administrar → Ajustes e inténtalo otra vez.'); }
  S.lastOrder = order; S.cart = []; saveCart(); Object.keys(FILES).forEach(k=>delete FILES[k]);
  S.checkout = {delivery:'recojo', rush:false}; S.view='done'; render(); window.scrollTo(0,0);
}
function viewDone(){
  const o = S.lastOrder, st = S.catalog.settings; if (!o) { S.view='orders'; return viewOrders(); }
  return `<div class="success">${PAW_SVG}<div class="eyebrow">Pedido recibido</div><h1>¡Gracias, ${esc(o.customer.name.split(' ')[0])}!</h1>
    <p class="muted">Tu código de pedido es</p><div class="code" style="font-size:34px">${esc(o.code)}</div>
    <div class="paybox">
      <b>Para confirmar, envía el anticipo de ${money(o.deposit)}</b>
      <span>Método: ${esc(o.payMethod)}${st.payNumber?` al <b class="num">${esc(st.payNumber)}</b>`:''}${st.payHolder?` a nombre de ${esc(st.payHolder)}`:''}.</span>
      ${st.whatsapp?`<span>Manda la captura con tu código al WhatsApp <b class="num">${esc(st.whatsapp)}</b> <button class="btn sm" data-act="copy" data-text="${esc(st.whatsapp)}">Copiar número</button></span>`:'<span>Te escribiremos por WhatsApp para coordinar el pago y aprobar el arte.</span>'}
      <span class="muted">Total del pedido: ${money(o.total)} · Saldo al entregar: ${money(o.total-o.deposit)}</span>
    </div>
    <div class="row" style="justify-content:center"><button class="btn primary" data-act="go" data-view="orders">Ver mis pedidos</button><button class="btn" data-act="go" data-view="shop">Seguir comprando</button></div></div>`;
}

/* ---- my orders ---- */
function track(o){
  if (o.status==='cancelado') return `<div>${pill('Cancelado','bad')}</div>`;
  const flow = STATUSES.slice(0,6); const idx = flow.findIndex(s=>s[0]===o.status);
  return `<div class="track">${flow.map((s,i)=>`<div class="${i<=idx?'on':''}"><i></i>${esc(s[1])}</div>`).join('')}</div>`;
}
function viewOrders(){
  const list = [...S.mine].sort((a,b)=>b.createdAt-a.createdAt);
  if (!list.length) return `<div class="empty">${PAW_SVG}<h2>Aún no tienes pedidos</h2><p class="muted">Cuando hagas uno, aquí verás en qué etapa va.</p><button class="btn primary" data-act="go" data-view="shop">Empezar a diseñar</button></div>`;
  return `<h1 style="margin-bottom:20px">Mis pedidos</h1><div style="display:grid;gap:14px">${list.map(o => `
    <article class="ocard">
      <div class="ohead"><div><div class="code">${esc(o.code)}</div><span class="muted" style="font-size:13px">Pedido el ${fmtDate(o.createdAt)} · Entrega estimada ${fmtDate(o.dueDate+'T12:00')}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${pill(...PAY[o.payStatus]||PAY.pendiente)}</div></div>
      ${track(o)}
      <div style="display:flex;gap:10px;flex-wrap:wrap">${o.items.map(i=>`<div style="width:74px;background:var(--surface-2);border-radius:10px" title="${esc(i.name)}">${mockSVG(i,'front')}</div>`).join('')}</div>
      <div class="line"><span class="muted">${o.items.length} producto${o.items.length===1?'':'s'} · ${o.items.reduce((s,i)=>s+i.qty,0)} unidades</span><span class="num"><b>${money(o.total)}</b>${o.paid<o.total?` <span class="muted">· saldo ${money(o.total-(o.paid||0))}</span>`:''}</span></div>
    </article>`).join('')}</div>`;
}

/* ---- admin ---- */
function viewAdmin(){
  const tabs = [['pedidos','Pedidos'],['productos','Productos'],['materiales','Materiales'],['tecnicas','Técnicas'],['catalogo','Categorías, colores y tallas'],['ajustes','Ajustes de la tienda']];
  const body = {pedidos:admOrders, productos:admProducts, materiales:admMaterials, tecnicas:admTechs, catalogo:admLists, ajustes:admSettings}[S.admTab] || admOrders;
  return `<div class="adm-head"><div><div class="eyebrow">Panel de administración</div><h1 style="margin-top:6px">${esc(S.catalog.settings.shopName)}</h1></div></div>
    <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-act="admtab" data-tab="${k}" aria-selected="${S.admTab===k}">${l}</button>`).join('')}</div>${body()}`;
}
function admOrders(){
  const all = allOrders(); const today = new Date().toISOString().slice(0,10);
  const active = all.filter(o => !['entregado','cancelado'].includes(o.status));
  const month = new Date(); month.setDate(1); month.setHours(0,0,0,0);
  const k = {nuevos: all.filter(o=>o.status==='recibido').length, prod: all.filter(o=>['aprobado','produccion'].includes(o.status)).length,
    listos: all.filter(o=>o.status==='listo').length, cobrar: active.reduce((s,o)=>s+Math.max(0,o.total-(o.paid||0)),0),
    mes: all.filter(o=>o.createdAt>=month.getTime() && o.status!=='cancelado').reduce((s,o)=>s+o.total,0)};
  const filters = [['activos','Activos'],['recibido','Nuevos'],['revision','En revisión'],['produccion','En producción'],['listo','Listos'],['entregado','Entregados'],['todos','Todos']];
  const q = S.admQuery.toLowerCase();
  let list = S.admFilter==='todos' ? all : S.admFilter==='activos' ? active : S.admFilter==='produccion' ? all.filter(o=>['aprobado','produccion'].includes(o.status)) : all.filter(o=>o.status===S.admFilter);
  if (q) list = list.filter(o => (o.code+' '+o.customer?.name+' '+o.customer?.phone).toLowerCase().includes(q));
  return `<div class="kpis">
      <div class="kpi"><b>${k.nuevos}</b><span>Pedidos nuevos</span></div>
      <div class="kpi"><b>${k.prod}</b><span>Aprobados o en producción</span></div>
      <div class="kpi"><b>${k.listos}</b><span>Listos para entregar</span></div>
      <div class="kpi"><b class="num" style="font-size:22px">${money(k.cobrar)}</b><span>Por cobrar · ${money(k.mes)} vendidos este mes</span></div>
    </div>
    <div class="toolbar"><div class="chips" style="margin:0">${filters.map(([v,l])=>`<button class="chip" data-act="admfilter" data-v="${v}" aria-pressed="${S.admFilter===v}">${l}</button>`).join('')}</div>
      <input type="search" id="adm-q" placeholder="Buscar código, cliente o celular" value="${esc(S.admQuery)}" data-in="admq" aria-label="Buscar pedidos"></div>
    ${list.length ? `<div class="tablewrap"><table><thead><tr><th>Código</th><th>Cliente</th><th>Productos</th><th>Entrega</th><th>Estado</th><th>Pago</th><th style="text-align:right">Total</th></tr></thead><tbody>
      ${list.map(o => { const sm = statusMeta(o.status); const late = o.dueDate < today && !['entregado','cancelado','listo'].includes(o.status);
        return `<tr class="click" data-act="order" data-uid="${esc(o._uid)}" data-oid="${esc(o._id||o.id)}" tabindex="0">
        <td><b>${esc(o.code)}</b>${o.rush?' <span class="pill t-bad" style="padding:1px 7px">Urgente</span>':''}<div class="muted" style="font-size:12.5px">${fmtDate(o.createdAt)}</div></td>
        <td>${esc(o.customer?.name)}<div class="muted num" style="font-size:12.5px">${esc(o.customer?.phone)}</div></td>
        <td style="font-size:13.5px">${o.items.map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td>
        <td class="${late?'late':''}">${fmtDate(o.dueDate+'T12:00')}${late?'<div style="font-size:12px">Atrasado</div>':''}<div class="muted" style="font-size:12.5px;font-weight:400">${o.delivery==='delivery'?'Envío':'Recoge en tienda'}</div></td>
        <td>${pill(sm[1], sm[2])}</td><td>${pill(...(PAY[o.payStatus]||PAY.pendiente))}</td>
        <td class="num" style="text-align:right;font-weight:700">${money(o.total)}</td></tr>`; }).join('')}
    </tbody></table></div>` : `<div class="empty card">${PAW_SVG}<p class="muted">${all.length ? 'Ningún pedido coincide con este filtro.' : 'Todavía no llegan pedidos. Cuando un cliente compre, aparecerá aquí.'}</p></div>`}`;
}
function admProducts(){
  const c = S.catalog;
  return `<div class="toolbar"><button class="btn primary" data-act="editprod" data-id="">Nuevo producto</button><span class="muted" style="font-size:13.5px">${c.products.filter(p=>p.active).length} de ${c.products.length} visibles en la tienda</span></div>
  <div class="alist">${c.products.map(p => `<div class="arow ${p.active?'':'off'}">
    <div class="mini">${photoOf(p) ? `<img src="${esc(photoOf(p))}" alt="">` : mockSVG({shape:p.shape,color:byId(c.colors,p.colors[0]),zones:[]},'front',{sample:true})}</div>
    <div style="min-width:0"><h3>${esc(p.name)} <span class="muted num" style="font-family:var(--f-body);font-size:14px;font-weight:600">${money(p.base)}</span></h3>
      <div class="tagline">${esc(byId(c.categories,p.cat)?.name||'Sin categoría')} · ${p.mats.map(m=>esc(byId(c.materials,m)?.name)).filter(Boolean).join(', ')}</div>
      <div class="tagline">${p.zones.length} zonas · ${p.colors.length} colores${p.useSizes?` · tallas ${esc(p.sizes.join(' '))}`:''}</div></div>
    <div class="acts"><label class="chk" style="font-size:13px"><input type="checkbox" data-act="toggleprod" data-id="${esc(p.id)}" ${p.active?'checked':''}> Visible</label>
      <button class="btn sm" data-act="editprod" data-id="${esc(p.id)}">Editar</button><button class="btn sm ghost" data-act="dupprod" data-id="${esc(p.id)}">Duplicar</button>
      <button class="btn sm ghost danger" data-act="del" data-kind="products" data-id="${esc(p.id)}">Eliminar</button></div></div>`).join('')}</div>`;
}
function admMaterials(){
  const c = S.catalog;
  return `<div class="toolbar"><button class="btn primary" data-act="editmat" data-id="">Nuevo material</button></div>
  <div class="tablewrap"><table><thead><tr><th>Material</th><th>Técnicas compatibles</th><th>Usado en</th><th style="text-align:right">Recargo</th><th></th></tr></thead><tbody>
  ${c.materials.map(m => { const used = c.products.filter(p=>p.mats.includes(m.id));
    return `<tr><td><b>${esc(m.name)}</b><div class="muted" style="font-size:12.5px">${esc(m.desc)}</div></td>
    <td style="font-size:13.5px">${m.techs.map(t=>esc(byId(c.techniques,t)?.name)).filter(Boolean).join(', ')||'<span class="muted">Ninguna</span>'}</td>
    <td style="font-size:13.5px">${used.map(p=>esc(p.name)).join(', ')||'<span class="muted">Sin uso</span>'}</td>
    <td class="num" style="text-align:right">${Number(m.add)?(m.add>0?'+':'−')+money(Math.abs(m.add)):'—'}</td>
    <td style="text-align:right;white-space:nowrap"><button class="btn sm" data-act="editmat" data-id="${esc(m.id)}">Editar</button> <button class="btn sm ghost danger" data-act="del" data-kind="materials" data-id="${esc(m.id)}">Eliminar</button></td></tr>`; }).join('')}
  </tbody></table></div>`;
}
function admTechs(){
  const c = S.catalog;
  return `<div class="toolbar"><button class="btn primary" data-act="edittech" data-id="">Nueva técnica</button></div>
  <div class="tablewrap"><table><thead><tr><th>Técnica</th><th>Disponible en</th><th style="text-align:right">Recargo por unidad</th><th></th></tr></thead><tbody>
  ${c.techniques.map(t => `<tr><td><b>${esc(t.name)}</b><div class="muted" style="font-size:12.5px">${esc(t.desc)}</div></td>
    <td style="font-size:13.5px">${c.materials.filter(m=>m.techs.includes(t.id)).map(m=>esc(m.name)).join(', ')||'<span class="muted">Ningún material</span>'}</td>
    <td class="num" style="text-align:right">${Number(t.add)?'+'+money(t.add):'—'}</td>
    <td style="text-align:right;white-space:nowrap"><button class="btn sm" data-act="edittech" data-id="${esc(t.id)}">Editar</button> <button class="btn sm ghost danger" data-act="del" data-kind="techniques" data-id="${esc(t.id)}">Eliminar</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function admLists(){
  const c = S.catalog;
  return `<form id="lists-form" class="two" style="align-items:start">
    <div class="card sect"><h3>Categorías</h3><div class="listedit" id="cat-list">${c.categories.map(k=>`<div class="r"><input type="text" name="cat-${esc(k.id)}" value="${esc(k.name)}" aria-label="Nombre de categoría"><button type="button" class="btn sm ghost danger" data-act="rmrow">Quitar</button></div>`).join('')}</div>
      <button type="button" class="btn sm" data-act="addcatrow">Agregar categoría</button>
      <h3 style="margin-top:10px">Tallas</h3><label class="f">Tallas disponibles, separadas por coma<input type="text" name="sizes" value="${esc(c.sizes.join(', '))}"></label></div>
    <div class="card sect"><h3>Colores de producto</h3><div class="listedit" id="col-list">${c.colors.map(k=>`<div class="r c3"><input type="color" name="colhex-${esc(k.id)}" value="${esc(k.hex)}" aria-label="Color"><input type="text" name="colname-${esc(k.id)}" value="${esc(k.name)}" aria-label="Nombre del color"><button type="button" class="btn sm ghost danger" data-act="rmrow">Quitar</button></div>`).join('')}</div>
      <button type="button" class="btn sm" data-act="addcolrow">Agregar color</button></div>
    <div style="grid-column:1/-1"><button class="btn primary" type="submit">Guardar cambios</button></div>
  </form>`;
}
function admSettings(){
  const s = S.catalog.settings;
  return `<form id="settings-form" class="two" style="align-items:start">
    <div class="card sect"><h3>Tienda y contacto</h3>
      <label class="f">Nombre de la tienda<input type="text" name="shopName" value="${esc(s.shopName)}"></label>
      <div class="row"><label class="f">WhatsApp de atención<input type="tel" name="whatsapp" value="${esc(s.whatsapp)}" placeholder="55 1234 5678"></label><label class="f">Moneda<input type="text" name="currency" value="${esc(s.currency)}"></label></div>
      <label class="f">Dirección de recojo<input type="text" name="pickupAddress" value="${esc(s.pickupAddress)}"></label>
      <div class="row"><label class="f">Costo de envío<input type="number" step="0.5" name="deliveryFee" value="${esc(s.deliveryFee)}"></label><label class="f">Cobertura de envío<input type="text" name="deliveryNote" value="${esc(s.deliveryNote)}"></label></div>
      <h3 style="margin-top:8px">Pagos</h3>
      <label class="f">Métodos de pago <span class="hint">uno por línea</span><textarea name="payMethods">${esc((s.payMethods||[]).join('\n'))}</textarea></label>
      <div class="row"><label class="f">CLABE, cuenta o tarjeta para depósitos<input type="text" name="payNumber" value="${esc(s.payNumber)}"></label><label class="f">Titular<input type="text" name="payHolder" value="${esc(s.payHolder)}"></label></div>
      <label class="f">Anticipo para confirmar (%)<input type="number" name="depositPct" min="0" max="100" value="${esc(s.depositPct)}"></label></div>
    <div class="card sect"><h3>Producción y precios</h3>
      <div class="row"><label class="f">Días hábiles normales<input type="number" name="normalDays" min="1" value="${esc(s.normalDays)}"></label><label class="f">Días con urgencia<input type="number" name="rushDays" min="1" value="${esc(s.rushDays)}"></label></div>
      <div class="row"><label class="f">Recargo por urgencia (%)<input type="number" name="rushPct" min="0" value="${esc(s.rushPct)}"></label><label class="f">Servicio de diseño (por modelo)<input type="number" step="0.5" name="designFee" min="0" value="${esc(s.designFee)}"></label></div>
      <h3 style="margin-top:8px">Descuentos por volumen</h3><p class="muted" style="font-size:13px">Se aplican según el total de unidades del pedido.</p>
      <div class="listedit" id="disc-list">${(s.discounts||[]).map((d,i)=>`<div class="row" style="align-items:end"><label class="f">Desde (unidades)<input type="number" min="1" name="dq-${i}" value="${esc(d.qty)}"></label><label class="f">Descuento (%)<input type="number" min="0" max="90" name="dp-${i}" value="${esc(d.pct)}"></label><button type="button" class="btn sm ghost danger" data-act="rmrow" style="flex:0 0 auto">Quitar</button></div>`).join('')}</div>
      <button type="button" class="btn sm" data-act="adddiscrow">Agregar nivel</button></div>
    <div style="grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" type="submit">Guardar ajustes</button>
      <button type="button" class="btn ghost danger" data-act="resetdemo">Restablecer datos de prueba</button></div>
  </form>`;
}

/* ---- admin modals ---- */
const modal = document.getElementById('modal');
function openModal(html){ modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`; modal.hidden = false; document.body.style.overflow='hidden'; modal.querySelector('input,select,textarea,button')?.focus(); }
function closeModal(){ modal.hidden = true; modal.innerHTML = ''; document.body.style.overflow=''; if (S._dirty) render(); }
const mHead = (eyebrow,title) => `<div class="sheet-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h2 style="margin-top:6px">${esc(title)}</h2></div><button class="btn sm" data-act="close">Cerrar</button></div>`;

function orderModal(o){
  const sm = statusMeta(o.status);
  return `${mHead('Pedido '+fmtDateTime(o.createdAt), o.code)}
  <div style="display:flex;gap:6px;flex-wrap:wrap">${pill(sm[1],sm[2])}${pill(...(PAY[o.payStatus]||PAY.pendiente))}${o.rush?pill('Urgente','bad'):''}</div>
  <div class="card" style="display:grid;gap:6px"><h3>${esc(o.customer?.name)}</h3>
    <span class="copy num">${esc(o.customer?.phone)} <button class="btn sm ghost" data-act="copy" data-text="${esc(o.customer?.phone)}">Copiar</button></span>
    ${o.customer?.email?`<span>${esc(o.customer.email)}</span>`:''}
    <span>${o.delivery==='delivery'?`Envío a: ${esc(o.address)}`:'Recoge en tienda'} · Paga con ${esc(o.payMethod)}</span></div>
  ${o.items.map(i => `<div class="card" style="display:grid;gap:10px">
    <div style="display:grid;grid-template-columns:88px minmax(0,1fr);gap:14px;align-items:start"><div style="background:var(--surface-2);border-radius:10px">${mockSVG(i,'front')}</div>
    <div style="display:grid;gap:3px;font-size:14px"><h3>${esc(i.name)} ×${i.qty}</h3>
      <span>${esc(i.mat?.name)} · ${esc(i.tech?.name)}${i.color?` · <span class="swatch-sm" style="background:${esc(i.color.hex)}"></span> ${esc(i.color.name)}`:''}</span>
      ${i.sizes?`<span><b>Tallas:</b> ${Object.entries(i.sizes).map(([s,n])=>`${esc(s)}×${n}`).join(' · ')}</span>`:''}
      ${i.text?`<span><b>Texto:</b> “${esc(i.text)}” (${esc(FONTS[i.textFont]?.label||'')}, ${esc(AREA_NAMES[i.textZone]||i.textZone)}) <span class="swatch-sm" style="background:${esc(i.textColor)}"></span></span>`:''}
      ${i.designHelp?'<span><b>Diseña Printly</b></span>':''}${i.notes?`<span><b>Indicaciones:</b> ${esc(i.notes)}</span>`:''}
      <span class="muted num">${money(i.unit)} c/u${i.design?` + diseño ${money(i.design)}`:''} = ${money(i.line)}</span></div></div>
    <div class="designs">${i.zones.map(z=>`<div class="design">${z.img?`<img src="${z.img}" alt="Diseño ${esc(z.label)}">`:'<div class="muted" style="aspect-ratio:1/1;display:grid;place-items:center;text-align:center">Sin imagen</div>'}
      <b>${esc(z.label)}</b>${z.name?`<span class="muted" style="overflow-wrap:anywhere">${esc(z.name)} · ${z.w}×${z.h}px</span>`:''}
      ${z.img?`<a class="btn sm" href="${z.img}" download="${esc((o.code+'-'+z.label).replace(/\s+/g,'-'))}.webp">Descargar</a>`:''}</div>`).join('')}</div></div>`).join('')}
  <div class="card" style="display:grid;gap:6px">
    <div class="line"><span>Subtotal</span><span class="num">${money(o.sub)}</span></div>
    ${o.disc?`<div class="line"><span>Descuento ${o.discPct}%</span><span class="num">−${money(o.disc)}</span></div>`:''}
    ${o.rushFee?`<div class="line"><span>Urgencia</span><span class="num">${money(o.rushFee)}</span></div>`:''}
    ${o.ship?`<div class="line"><span>Envío</span><span class="num">${money(o.ship)}</span></div>`:''}
    <div class="line total"><span>Total</span><span class="num">${money(o.total)}</span></div>
    <div class="line"><span>Pagado</span><span class="num">${money(o.paid)} · saldo ${money(o.total-(o.paid||0))}</span></div></div>
  <form id="order-form" class="card" style="display:grid;gap:12px" data-uid="${esc(o._uid)}" data-oid="${esc(o._id||o.id)}"><h3>Gestionar</h3>
    <div class="row"><label class="f">Estado<select name="status" id="o-status">${STATUSES.map(s=>`<option value="${s[0]}" ${o.status===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></label>
      <label class="f">Fecha de entrega<input type="date" name="dueDate" id="o-due" value="${esc(o.dueDate)}"></label></div>
    <div class="row"><label class="f">Monto pagado (${esc(cur())} MXN)<input type="number" step="0.1" min="0" name="paid" id="o-paid" value="${esc(o.paid||0)}"></label>
      <div style="display:flex;gap:6px;align-items:end;flex-wrap:wrap"><button type="button" class="btn sm" data-act="setpaid" data-v="${o.deposit}">Anticipo ${money(o.deposit)}</button><button type="button" class="btn sm" data-act="setpaid" data-v="${o.total}">Total</button></div></div>
    <label class="f">Notas internas<textarea name="adminNotes" id="o-notes" placeholder="Solo las ve el equipo">${esc(o.adminNotes)}</textarea></label>
    <button class="btn primary" type="submit">Guardar pedido</button></form>
  <div class="hist"><h3>Historial</h3>${(o.history||[]).slice().reverse().map(h=>`<div><span class="muted num" style="min-width:120px">${fmtDateTime(h.at)}</span><span>${esc(statusMeta(h.status)[1])}</span></div>`).join('')}</div>`;
}
let PDRAFT = null;
function prodModal(p){
  const c = S.catalog; const isNew = !c.products.some(x=>x.id===p.id);
  const avail = AREAS[p.shape]||{};
  return `${mHead(isNew?'Nuevo producto':'Editar producto', p.name||'Producto sin nombre')}
  <form id="prod-form" style="display:grid;gap:14px">
    <label class="f">Nombre<input type="text" name="name" id="p-name" value="${esc(p.name)}" required></label>
    <div class="row"><label class="f">Categoría<select name="cat" id="p-cat">${c.categories.map(k=>`<option value="${esc(k.id)}" ${p.cat===k.id?'selected':''}>${esc(k.name)}</option>`).join('')}</select></label>
      <label class="f">Molde de vista previa<select name="shape" id="p-shape" data-act="shapechange">${Object.entries(SHAPES).map(([k,l])=>`<option value="${k}" ${p.shape===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="row"><label class="f">Precio base (${esc(cur())})<input type="number" step="0.5" min="0" name="base" id="p-base" value="${esc(p.base)}"></label>
      <label class="f">Pedido mínimo<input type="number" min="1" name="minQty" id="p-min" value="${esc(p.minQty||1)}"></label></div>
    <label class="f">Descripción<input type="text" name="desc" id="p-desc" value="${esc(p.desc)}"></label>
    <label class="chk"><input type="checkbox" name="active" ${p.active?'checked':''}> Visible en la tienda</label>
    <label class="f">Etiqueta destacada <span class="hint">opcional, ej. “Más pedido”</span><input type="text" name="badge" id="p-badge" maxlength="20" value="${esc(p.badge||'')}"></label>
    <fieldset class="card" style="display:grid;gap:10px"><legend class="eyebrow">Fotos del producto</legend><p class="muted" style="font-size:13px">La primera es la portada en la tienda. Sin fotos se muestra la vista previa dibujada.</p>
      <div class="phedit">${(p.photos||[]).map((src,i) => `<div class="phi"><img src="${esc(src)}" alt="Foto ${i+1}">${i===0?'<span class="tag">Portada</span>':''}<div class="phi-acts">${i?`<button type="button" class="btn sm" data-act="coverphoto" data-i="${i}">Portada</button>`:''}<button type="button" class="btn sm danger" data-act="rmphoto" data-i="${i}">Quitar</button></div></div>`).join('')}
      <label class="phadd upl"><span>+ Agregar foto</span><input type="file" accept="image/*" data-prodphoto="1" aria-label="Agregar foto del producto"></label></div></fieldset>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Materiales</legend><div class="checks">${c.materials.map(m=>`<label class="chk"><input type="checkbox" name="mat" value="${esc(m.id)}" ${p.mats.includes(m.id)?'checked':''}> ${esc(m.name)}</label>`).join('')}</div></fieldset>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Colores</legend><p class="muted" style="font-size:13px">Sin colores marcados, el producto se muestra en su color natural (vidrio, cerámica blanca…).</p><div class="checks">${c.colors.map(k=>`<label class="chk"><input type="checkbox" name="color" value="${esc(k.id)}" ${p.colors.includes(k.id)?'checked':''}> <span class="swatch-sm" style="background:${esc(k.hex)}"></span> ${esc(k.name)}</label>`).join('')}</div></fieldset>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Tallas</legend><label class="chk"><input type="checkbox" name="useSizes" ${p.useSizes?'checked':''}> Se vende por tallas</label>
      <div class="checks">${c.sizes.map(s=>`<label class="chk"><input type="checkbox" name="size" value="${esc(s)}" ${(p.sizes||[]).includes(s)?'checked':''}> ${esc(s)}</label>`).join('')}</div></fieldset>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Zonas de impresión</legend>
      <div class="zoneedit muted" style="font-size:12px;font-weight:700"><span></span><span>Nombre para el cliente</span><span>Recargo</span></div>
      ${Object.keys(avail).map(k => { const z = (p.zones||[]).find(z=>z.key===k);
        return `<div class="zoneedit"><input type="checkbox" name="zone" value="${k}" ${z?'checked':''} aria-label="${esc(AREA_NAMES[k])}" style="width:17px;height:17px;accent-color:var(--accent)">
        <input type="text" name="zl-${k}" value="${esc(z?.label||AREA_NAMES[k])}" aria-label="Nombre de la zona"><input type="number" step="0.5" min="0" name="zx-${k}" value="${esc(z?.extra||0)}" aria-label="Recargo"></div>`; }).join('')}</fieldset>
    <p class="err" id="p-err" hidden></p>
    <button class="btn primary" type="submit">${isNew?'Crear producto':'Guardar producto'}</button>
  </form>`;
}
function readProdForm(form){
  const fd = new FormData(form); const shape = fd.get('shape'); const avail = AREAS[shape]||{};
  return {...PDRAFT, name:(fd.get('name')||'').trim(), cat:fd.get('cat'), shape, base:Number(fd.get('base'))||0, minQty:Math.max(1,Number(fd.get('minQty'))||1),
    desc:(fd.get('desc')||'').trim(), badge:(fd.get('badge')||'').trim(), active:fd.get('active')==='on', mats:fd.getAll('mat'), colors:fd.getAll('color'),
    useSizes:fd.get('useSizes')==='on', sizes:fd.getAll('size'),
    zones: Object.keys(avail).filter(k => fd.getAll('zone').includes(k)).map(k => ({key:k, label:(fd.get('zl-'+k)||AREA_NAMES[k]).trim(), extra:Number(fd.get('zx-'+k))||0}))};
}
function matModal(m){
  const c = S.catalog;
  return `${mHead(m._new?'Nuevo material':'Editar material', m.name||'Material sin nombre')}
  <form id="mat-form" style="display:grid;gap:14px">
    <label class="f">Nombre<input type="text" name="name" id="m-name" value="${esc(m.name)}" required></label>
    <label class="f">Descripción para el cliente<input type="text" name="desc" id="m-desc" value="${esc(m.desc)}"></label>
    <label class="f">Recargo sobre el precio base <span class="hint">usa un número negativo si abarata</span><input type="number" step="0.5" name="add" id="m-add" value="${esc(m.add)}"></label>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Técnicas compatibles</legend><div class="checks">${c.techniques.map(t=>`<label class="chk"><input type="checkbox" name="tech" value="${esc(t.id)}" ${m.techs.includes(t.id)?'checked':''}> ${esc(t.name)}</label>`).join('')}</div></fieldset>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Productos que lo ofrecen</legend><div class="checks">${c.products.map(p=>`<label class="chk"><input type="checkbox" name="prod" value="${esc(p.id)}" ${p.mats.includes(m.id)?'checked':''}> ${esc(p.name)}</label>`).join('')}</div></fieldset>
    <p class="err" id="m-err" hidden></p>
    <button class="btn primary" type="submit">Guardar material</button></form>`;
}
function techModal(t){
  const c = S.catalog;
  return `${mHead(t._new?'Nueva técnica':'Editar técnica', t.name||'Técnica sin nombre')}
  <form id="tech-form" style="display:grid;gap:14px">
    <label class="f">Nombre<input type="text" name="name" id="t-name" value="${esc(t.name)}" required></label>
    <label class="f">Descripción para el cliente<input type="text" name="desc" id="t-desc" value="${esc(t.desc)}"></label>
    <label class="f">Recargo por unidad (${esc(cur())})<input type="number" step="0.5" min="0" name="add" id="t-add" value="${esc(t.add)}"></label>
    <fieldset class="card" style="display:grid;gap:8px"><legend class="eyebrow">Materiales donde se puede usar</legend><div class="checks">${c.materials.map(m=>`<label class="chk"><input type="checkbox" name="mat" value="${esc(m.id)}" ${m.techs.includes(t.id)?'checked':''}> ${esc(m.name)}</label>`).join('')}</div></fieldset>
    <p class="err" id="t-err" hidden></p>
    <button class="btn primary" type="submit">Guardar técnica</button></form>`;
}
const slug = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30) || rid();
function uniqueId(arr, base){ let id = slug(base), n = 2; while (arr.some(x=>x.id===id)) id = slug(base)+'-'+n++; return id; }

/* ---------- lightbox ---------- */
const LBEL = document.getElementById('lightbox'); const LB = {p:null, i:0};
function openLightbox(p, i){ LB.p = p; LB.i = i||0; LBEL.hidden = false; document.body.style.overflow='hidden'; drawLightbox(); }
function drawLightbox(){ const n = LB.p.photos.length;
  LBEL.innerHTML = `<div class="lb-in"><img src="${esc(LB.p.photos[LB.i])}" alt="${esc(LB.p.name)}"><div class="lb-bar"><span>${esc(LB.p.name)} · ${LB.i+1}/${n}</span><div>${n>1?`<button class="btn sm" data-act="lbnav" data-d="-1" aria-label="Anterior">←</button><button class="btn sm" data-act="lbnav" data-d="1" aria-label="Siguiente">→</button>`:''}<button class="btn sm primary" data-act="lbclose">Cerrar</button></div></div></div>`; }
function closeLightbox(){ LBEL.hidden = true; LBEL.innerHTML=''; document.body.style.overflow=''; }
LBEL.addEventListener('click', e => { if (e.target === LBEL) closeLightbox(); });

/* ---------- events ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) { if (e.target === modal) closeModal(); return; }
  const a = el.dataset.act, c = S.catalog;
  if (el.tagName==='INPUT' || el.tagName==='SELECT') return; // handled by change
  switch(a){
    case 'go': S.view = el.dataset.view; if (S.view==='cart' && S.cfg) S.cfg.editKey = undefined; render(); window.scrollTo(0,0); break;
    case 'cat': S.cat = el.dataset.cat; render(); break;
    case 'catgo': S.cat = el.dataset.cat; render(); document.getElementById('productos')?.scrollIntoView({behavior:'smooth'}); break;
    case 'scrollto': { if (S.view!=='shop'){ S.view='shop'; render(); } const t = document.getElementById(el.dataset.to); if (t) t.scrollIntoView({behavior:'smooth'}); break; }
    case 'viewphoto': { const p = byId(c.products, el.dataset.pid); openLightbox(p, Number(el.dataset.i)); break; }
    case 'lbnav': LB.i = (LB.i + Number(el.dataset.d) + LB.p.photos.length) % LB.p.photos.length; drawLightbox(); break;
    case 'lbclose': closeLightbox(); break;
    case 'rmphoto': case 'coverphoto': { const f = document.getElementById('prod-form'); PDRAFT = readProdForm(f); const i = Number(el.dataset.i); const ph = [...(PDRAFT.photos||[])];
      const [x] = ph.splice(i,1); if (a==='coverphoto') ph.unshift(x); PDRAFT.photos = ph; modal.querySelector('.sheet').innerHTML = prodModal(PDRAFT); break; }
    case 'open': { const p = byId(c.products, el.dataset.pid); S.cfg = newCfg(p); S.side='front'; Object.keys(FILES).filter(k=>k.startsWith('cfg:')).forEach(k=>delete FILES[k]); S.view='custom'; render(); window.scrollTo(0,0); break; }
    case 'side': S.side = el.dataset.side; render(); break;
    case 'mat': { S.cfg.mat = el.dataset.id; const m = byId(c.materials, el.dataset.id); if (!m.techs.includes(S.cfg.tech)) S.cfg.tech = m.techs.find(t=>byId(c.techniques,t)); render(); break; }
    case 'tech': S.cfg.tech = el.dataset.id; render(); break;
    case 'color': S.cfg.color = el.dataset.id; render(); break;
    case 'rmimg': { const z = S.cfg.zones[el.dataset.key]; delete z.img; delete z.name; delete z.w; delete z.h; delete FILES[`cfg:${el.dataset.key}`]; render(); break; }
    case 'addcart': addToCart(); break;
    case 'editcart': { const it = S.cart.find(i=>i.key===el.dataset.key); if (!it) break; const p = byId(c.products,it.pid); if (!p){ toast('Este producto ya no está disponible.'); break; }
      S.cfg = {...clone(it.cfg), editKey: it.key};
      for (const z of it.zones){ const f = FILES[`${it.key}:${z.key}`]; if (f) FILES[`cfg:${z.key}`] = f; }
      S.side='front'; S.view='custom'; render(); window.scrollTo(0,0); break; }
    case 'rmcart': S.cart = S.cart.filter(i=>i.key!==el.dataset.key); saveCart(); render(); break;
    case 'delivery': S.checkout.delivery = el.dataset.v; keepCheckoutFields(() => render()); break;
    case 'copy': try { await navigator.clipboard.writeText(el.dataset.text); toast('Copiado'); } catch(err){ toast(el.dataset.text); } break;
    case 'seed': if (await saveCatalog(clone(DEFAULT_CATALOG))) toast('Catálogo cargado'); break;
    case 'admtab': S.admTab = el.dataset.tab; render(); break;
    case 'admfilter': S.admFilter = el.dataset.v; render(); break;
    case 'order': { const o = allOrders().find(x => x._uid===el.dataset.uid && (x._id||x.id)===el.dataset.oid); if (o) openModal(orderModal(o)); break; }
    case 'close': closeModal(); break;
    case 'setpaid': document.getElementById('o-paid').value = (Math.round(Number(el.dataset.v)*100)/100); break;
    case 'editprod': { const p = el.dataset.id ? byId(c.products, el.dataset.id) : {id:'', name:'', cat:c.categories[0]?.id, shape:'tee', base:20, minQty:1, desc:'', active:true, mats:[], colors:[], useSizes:false, sizes:[], zones:[{key:'frente',label:'Frente',extra:0}]};
      PDRAFT = clone(p); openModal(prodModal(PDRAFT)); break; }
    case 'dupprod': { const p = clone(byId(c.products, el.dataset.id)); p.id = uniqueId(c.products, p.name+' copia'); p.name += ' (copia)'; p.active = false;
      const cat = clone(c); cat.products.push(p); if (await saveCatalog(cat)) toast('Producto duplicado como oculto'); break; }
    case 'editmat': { const m = el.dataset.id ? clone(byId(c.materials, el.dataset.id)) : {id:'', name:'', desc:'', add:0, techs:[], _new:true}; PDRAFT = m; openModal(matModal(m)); break; }
    case 'edittech': { const t = el.dataset.id ? clone(byId(c.techniques, el.dataset.id)) : {id:'', name:'', desc:'', add:0, _new:true}; PDRAFT = t; openModal(techModal(t)); break; }
    case 'del': {
      if (!el.classList.contains('armed')) { el.classList.add('armed'); el.textContent = '¿Eliminar?'; setTimeout(()=>{ if (el.isConnected){ el.classList.remove('armed'); el.textContent='Eliminar'; } }, 3500); break; }
      const cat = clone(c); const kind = el.dataset.kind, id = el.dataset.id;
      cat[kind] = cat[kind].filter(x=>x.id!==id);
      if (kind==='materials') cat.products.forEach(p => p.mats = p.mats.filter(m=>m!==id));
      if (kind==='techniques') cat.materials.forEach(m => m.techs = m.techs.filter(t=>t!==id));
      if (await saveCatalog(cat)) toast('Eliminado'); break; }
    case 'rmrow': el.closest('.r, .row').remove(); break;
    case 'addcatrow': document.getElementById('cat-list').insertAdjacentHTML('beforeend', `<div class="r"><input type="text" name="cat-new-${rid()}" placeholder="Nueva categoría" aria-label="Nombre de categoría"><button type="button" class="btn sm ghost danger" data-act="rmrow">Quitar</button></div>`); break;
    case 'addcolrow': { const k = rid(); document.getElementById('col-list').insertAdjacentHTML('beforeend', `<div class="r c3"><input type="color" name="colhex-new${k}" value="#888888" aria-label="Color"><input type="text" name="colname-new${k}" placeholder="Nombre del color" aria-label="Nombre del color"><button type="button" class="btn sm ghost danger" data-act="rmrow">Quitar</button></div>`); break; }
    case 'adddiscrow': { const i = 'n'+rid(); document.getElementById('disc-list').insertAdjacentHTML('beforeend', `<div class="row" style="align-items:end"><label class="f">Desde (unidades)<input type="number" min="1" name="dq-${i}" value="24"></label><label class="f">Descuento (%)<input type="number" min="0" max="90" name="dp-${i}" value="12"></label><button type="button" class="btn sm ghost danger" data-act="rmrow" style="flex:0 0 auto">Quitar</button></div>`); break; }
    case 'resetdemo': if (!el.classList.contains('armed')) { el.classList.add('armed'); el.textContent='¿Borrar pedidos y catálogo de prueba?'; break; }
      try { localStorage.removeItem('printly_catalog'); localStorage.removeItem('printly_orders'); localStorage.removeItem('printly_cart'); } catch(err){}
      S.cart = []; loadData(); toast('Datos de prueba restablecidos'); break;
  }
});
document.addEventListener('keydown', e => {
  if (!LBEL.hidden){ if (e.key==='Escape') closeLightbox(); if (e.key==='ArrowRight'||e.key==='ArrowLeft'){ LB.i = (LB.i + (e.key==='ArrowRight'?1:-1) + LB.p.photos.length) % LB.p.photos.length; drawLightbox(); } return; }
  if (e.key==='Escape' && !modal.hidden) closeModal();
  if (e.key==='Enter' && e.target.matches('tr[data-act="order"]')) e.target.click();
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.up){ const f = el.files?.[0]; if (!f) return; const key = el.dataset.up;
    if (!f.type.startsWith('image/')) { toast('Sube una imagen PNG o JPG.'); return; }
    try { const r = await compressImage(f); Object.assign(S.cfg.zones[key], {on:true, img:r.img, name:f.name, w:r.w, h:r.h}); FILES[`cfg:${key}`] = f; if (!S.cfg.text) S.cfg.textZone = S.cfg.textZone; render(); }
    catch(err){ toast(err.message); } return; }
  if (el.dataset.prodphoto){ const f = el.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) { toast('Elige una imagen JPG, PNG o WEBP.'); return; }
    try { const r = await compressImage(f, 900); PDRAFT = readProdForm(el.form); PDRAFT.photos = [...(PDRAFT.photos||[]), r.img]; modal.querySelector('.sheet').innerHTML = prodModal(PDRAFT); }
    catch(err){ toast(err.message); } return; }
  if (el.dataset.act==='zone'){ S.cfg.zones[el.dataset.key].on = el.checked; const side = AREAS[byId(S.catalog.products,S.cfg.pid).shape][el.dataset.key][4]; if (el.checked) S.side = side; render(); return; }
  if (el.dataset.act==='designhelp'){ S.cfg.designHelp = el.checked; refreshCustom(); return; }
  if (el.dataset.act==='rush'){ S.checkout.rush = el.checked; keepCheckoutFields(() => render()); return; }
  if (el.dataset.act==='toggleprod'){ const cat = clone(S.catalog); const p = byId(cat.products, el.dataset.id); p.active = el.checked; await saveCatalog(cat); toast(el.checked?'Visible en la tienda':'Oculto de la tienda'); return; }
  if (el.dataset.act==='shapechange'){ PDRAFT = readProdForm(el.form); const keep = {}; PDRAFT.zones.forEach(z=>keep[z.key]=z); PDRAFT.zones = Object.keys(AREAS[PDRAFT.shape]).filter(k=>keep[k]).map(k=>keep[k]); if (!PDRAFT.zones.length) PDRAFT.zones=[{key:'frente',label:'Frente',extra:0}]; modal.querySelector('.sheet').innerHTML = prodModal(PDRAFT); return; }
  if (el.dataset.in==='textFont' || el.dataset.in==='textZone'){ S.cfg[el.dataset.in] = el.value; if (el.dataset.in==='textZone'){ const p = byId(S.catalog.products,S.cfg.pid); const sd = AREAS[p.shape][el.value]?.[4]; if (sd && sd!==S.side && hasBack(p.shape)) { S.side = sd; render(); return; } } refreshCustom(); }
  if (el.dataset.size || el.dataset.in) { if (S._dirty && !document.activeElement?.matches?.('input,textarea')) render(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.size){ S.cfg.sizes[el.dataset.size] = Math.max(0, parseInt(el.value)||0); refreshCustom(); return; }
  if (el.dataset.in==='admq'){ S.admQuery = el.value; const pos = el.selectionStart; render(); const n = document.getElementById('adm-q'); if (n){ n.focus(); n.setSelectionRange(pos,pos); } return; }
  if (el.dataset.in && S.cfg && S.view==='custom'){ const k = el.dataset.in; S.cfg[k] = k==='qty' ? Math.max(0, parseInt(el.value)||0) : el.value; refreshCustom(); }
});
document.addEventListener('focusout', () => { setTimeout(() => { if (S._dirty && !(document.activeElement && app.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render(); }, 0); });
function keepCheckoutFields(fn){
  const f = document.getElementById('checkout'); const saved = f ? Object.fromEntries(new FormData(f)) : {};
  fn();
  const n = document.getElementById('checkout'); if (!n) return;
  for (const [k,v] of Object.entries(saved)){ const i = n.elements[k]; if (i) i.value = v; }
}
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault(); const c = S.catalog;
  if (f.id==='checkout') return submitOrder(f);
  if (f.id==='order-form'){
    const o = allOrders().find(x => x._uid===f.dataset.uid && (x._id||x.id)===f.dataset.oid); if (!o) return;
    const fd = new FormData(f); const paid = Math.max(0, Number(fd.get('paid'))||0); const status = fd.get('status');
    const patch = {status, dueDate: fd.get('dueDate')||o.dueDate, paid, adminNotes: fd.get('adminNotes')||'',
      payStatus: paid >= o.total - 0.01 ? 'pagado' : paid > 0 ? 'adelanto' : 'pendiente'};
    if (status !== o.status) patch.history = [...(o.history||[]), {status, at: Date.now()}];
    try { await patchOrder(o, patch); toast('Pedido actualizado'); closeModal(); render(); } catch(err){ toast('No se pudo guardar el pedido. Inténtalo otra vez.'); }
    return;
  }
  if (f.id==='prod-form'){
    const p = readProdForm(f); const err = document.getElementById('p-err');
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (!p.name) return fail('Ponle un nombre al producto.');
    if (!p.mats.length) return fail('Marca al menos un material.');
    if (!p.zones.length) return fail('Marca al menos una zona de impresión.');
    if (p.useSizes && !p.sizes.length) return fail('Marca las tallas que se venden o desmarca “Se vende por tallas”.');
    const cat = clone(c); if (!p.id) { p.id = uniqueId(cat.products, p.name); cat.products.push(p); } else { const i = cat.products.findIndex(x=>x.id===p.id); cat.products[i] = p; }
    if (await saveCatalog(cat)) { closeModal(); toast('Producto guardado'); } return;
  }
  if (f.id==='mat-form'){
    const fd = new FormData(f); const name = (fd.get('name')||'').trim(); if (!name) { const er = document.getElementById('m-err'); er.textContent='Ponle un nombre al material.'; er.hidden=false; return; }
    const cat = clone(c); let m = PDRAFT; const isNew = !!m._new; delete m._new;
    m = {...m, name, desc:(fd.get('desc')||'').trim(), add:Number(fd.get('add'))||0, techs:fd.getAll('tech')};
    if (isNew) { m.id = uniqueId(cat.materials, name); cat.materials.push(m); } else cat.materials[cat.materials.findIndex(x=>x.id===m.id)] = m;
    const prods = fd.getAll('prod'); cat.products.forEach(p => { const has = p.mats.includes(m.id); if (prods.includes(p.id) && !has) p.mats.push(m.id); if (!prods.includes(p.id) && has) p.mats = p.mats.filter(x=>x!==m.id); });
    if (await saveCatalog(cat)) { closeModal(); toast('Material guardado'); } return;
  }
  if (f.id==='tech-form'){
    const fd = new FormData(f); const name = (fd.get('name')||'').trim(); if (!name) { const er = document.getElementById('t-err'); er.textContent='Ponle un nombre a la técnica.'; er.hidden=false; return; }
    const cat = clone(c); let t = PDRAFT; const isNew = !!t._new; delete t._new;
    t = {...t, name, desc:(fd.get('desc')||'').trim(), add:Number(fd.get('add'))||0};
    if (isNew) { t.id = uniqueId(cat.techniques, name); cat.techniques.push(t); } else cat.techniques[cat.techniques.findIndex(x=>x.id===t.id)] = t;
    const mats = fd.getAll('mat'); cat.materials.forEach(m => { const has = m.techs.includes(t.id); if (mats.includes(m.id) && !has) m.techs.push(t.id); if (!mats.includes(m.id) && has) m.techs = m.techs.filter(x=>x!==t.id); });
    if (await saveCatalog(cat)) { closeModal(); toast('Técnica guardada'); } return;
  }
  if (f.id==='lists-form'){
    const fd = new FormData(f); const cat = clone(c);
    const cats = []; for (const [k,v] of fd){ if (k.startsWith('cat-') && v.trim()){ const id = k.slice(4); cats.push(id.startsWith('new-') ? {id:uniqueId([...cat.categories,...cats], v), name:v.trim()} : {id, name:v.trim()}); } }
    if (!cats.length) return toast('Deja al menos una categoría.');
    const cols = []; for (const [k,v] of fd){ if (k.startsWith('colname-') && v.trim()){ const id = k.slice(8); const hex = fd.get('colhex-'+id); cols.push(id.startsWith('new') ? {id:uniqueId([...cat.colors,...cols], v), name:v.trim(), hex} : {id, name:v.trim(), hex}); } }
    const sizes = String(fd.get('sizes')||'').split(',').map(s=>s.trim()).filter(Boolean);
    cat.categories = cats; cat.colors = cols; cat.sizes = sizes;
    cat.products.forEach(p => { p.colors = p.colors.filter(id => cols.some(k=>k.id===id)); p.sizes = (p.sizes||[]).filter(s=>sizes.includes(s)); if (!cats.some(k=>k.id===p.cat)) p.cat = cats[0].id; });
    if (await saveCatalog(cat)) toast('Cambios guardados'); return;
  }
  if (f.id==='settings-form'){
    const fd = new FormData(f); const cat = clone(c); const s = cat.settings;
    for (const k of ['shopName','whatsapp','currency','pickupAddress','deliveryNote','payNumber','payHolder']) s[k] = (fd.get(k)||'').trim();
    for (const k of ['deliveryFee','depositPct','normalDays','rushDays','rushPct','designFee']) s[k] = Math.max(0, Number(fd.get(k))||0);
    s.payMethods = String(fd.get('payMethods')||'').split('\n').map(x=>x.trim()).filter(Boolean);
    const disc = []; for (const [k,v] of fd){ if (k.startsWith('dq-')){ const i = k.slice(3); const q = Number(v), pc = Number(fd.get('dp-'+i)); if (q>0 && pc>0) disc.push({qty:q, pct:pc}); } }
    s.discounts = disc.sort((a,b)=>a.qty-b.qty);
    if (await saveCatalog(cat)) toast('Ajustes guardados'); return;
  }
});

init();
