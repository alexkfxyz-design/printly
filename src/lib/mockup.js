// Vistas previas en SVG de cada molde de producto (viewBox 300x320).
// Cada zona de impresión: [x, y, ancho, alto, lado].
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const AREAS = {
  tee:     {frente:[113,100,74,92,'front'], espalda:[106,88,88,118,'back'], manga_izq:[50,80,26,24,'front'], manga_der:[224,80,26,24,'front']},
  hoodie:  {frente:[114,100,72,72,'front'], espalda:[102,92,96,120,'back'], manga_izq:[52,140,24,44,'front'], manga_der:[224,140,24,44,'front']},
  mug:     {frente:[96,112,100,118,'front'], reverso:[104,112,100,118,'back']},
  beer:    {frente:[102,118,88,104,'front']},
  tumbler: {frente:[114,124,72,112,'front'], reverso:[114,124,72,112,'back']},
  keychain:{frente:[106,112,88,126,'front'], reverso:[106,112,88,126,'back']},
  cap:     {frente:[120,118,60,46,'front'], lateral:[194,138,28,30,'front']},
  bag:     {frente:[100,150,100,110,'front'], reverso:[100,150,100,110,'back']},
  crew:    {frente:[112,92,76,92,'front'], espalda:[102,88,96,124,'back'], manga_izq:[52,140,24,44,'front'], manga_der:[224,140,24,44,'front']},
  print:   {frente:[82,56,136,198,'front']}
};
export const SHAPES = {tee:'Playera',hoodie:'Sudadera',mug:'Taza',beer:'Tarro de vidrio',tumbler:'Termo',keychain:'Llavero',cap:'Gorra',bag:'Tote bag',crew:'Sudadera sin capucha',print:'Impresión fotográfica'};
export const AREA_NAMES = {frente:'Frente',espalda:'Espalda',reverso:'Reverso',manga_izq:'Manga izquierda',manga_der:'Manga derecha',lateral:'Lateral'};
export const FONTS = {script:{label:'Manuscrita',family:'Caveat, cursive',scale:1.15},block:{label:'Bloque',family:'"Bebas Neue", Impact, sans-serif',scale:1.05},classic:{label:'Clásica',family:'Fraunces, Georgia, serif',scale:.85}};
export function shade(hex,amt){ let h=(hex||'#ffffff').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
  const n=parseInt(h,16); let r=n>>16&255,g=n>>8&255,b=n&255;
  const f=v=>Math.max(0,Math.min(255,Math.round(amt<0? v*(1+amt) : v+(255-v)*amt)));
  return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
export function lum(hex){ let h=(hex||'#fff').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255; }
export const PAW_SVG = `<svg class="paw" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><ellipse cx="18" cy="22" rx="7" ry="9"/><ellipse cx="32" cy="15" rx="7" ry="9"/><ellipse cx="46" cy="22" rx="7" ry="9"/><ellipse cx="52" cy="36" rx="6" ry="7.5"/><path d="M32 30c-9 0-17 9-17 17 0 6 5 9 10 8 3-.5 4.5-2 7-2s4 1.5 7 2c5 1 10-2 10-8 0-8-8-17-17-17z"/></svg>`;

function silhouette(shape, fill, side){
  const e = shade(fill, lum(fill)>.5 ? -.22 : .28), d = shade(fill,-.12);
  const st = `stroke="${e}" stroke-width="2" stroke-linejoin="round"`;
  const sh = (p) => `<path d="${p}" fill="url(#shd)" opacity=".9"/>`;
  switch(shape){
    case 'tee': { const p = `M95 40 L130 28 Q150 ${side==='front'?50:36} 170 28 L205 40 L262 78 L238 124 L212 110 L212 292 Q150 298 88 292 L88 110 L62 124 L38 78 Z`;
      return `<path d="${p}" fill="${fill}" ${st}/>${sh(p)}<path d="M130 28 Q150 ${side==='front'?50:36} 170 28" fill="none" stroke="${e}" stroke-width="5" opacity=".5"/><path d="M88 110 L88 120 M212 110 L212 120" stroke="${e}" stroke-width="1.5" opacity=".5"/>`; }
    case 'hoodie': case 'crew': { const p = 'M98 54 L126 44 Q150 58 174 44 L202 54 L246 92 L266 236 L240 242 L220 134 L216 292 Q150 298 84 292 L80 134 L60 242 L34 236 L54 92 Z';
      if (shape==='crew') return `<path d="${p}" fill="${fill}" ${st}/>${sh(p)}<path d="M126 46 Q150 ${side==='front'?66:54} 174 46" fill="none" stroke="${e}" stroke-width="6" opacity=".55"/><path d="M84 280 Q150 286 216 280 M64 232 L38 228 M236 232 L262 228" fill="none" stroke="${e}" stroke-width="2" opacity=".6"/>`;
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
    case 'print': return `<rect x="74" y="48" width="160" height="222" rx="3" fill="#000" opacity=".12" transform="translate(6 6)"/><rect x="70" y="44" width="160" height="222" rx="3" fill="#FFFFFF" stroke="#CFC6BF" stroke-width="2"/>`;
    case 'bag': { const p='M76 110 L224 110 L224 292 L76 292 Z';
      return `<path d="M116 112 Q116 46 150 46 Q184 46 184 112" fill="none" stroke="${e}" stroke-width="10" stroke-linecap="round"/><path d="M116 112 Q116 46 150 46 Q184 46 184 112" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round"/><path d="${p}" fill="${fill}" ${st}/>${sh(p)}`; }
  }
  return '';
}
export function mockSVG(it, side='front', opts={}){
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
export function hasBack(shape){ return Object.values(AREAS[shape]||{}).some(a => a[4]==='back'); }

