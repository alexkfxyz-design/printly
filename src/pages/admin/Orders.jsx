import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { deleteOrder, subscribeAllOrders, updateOrder } from '../../lib/db.js';
import { fmtDate, fmtDateTime, PAY, STATUSES, statusMeta, waLink } from '../../lib/format.js';
import { AREA_NAMES, FONTS } from '../../lib/mockup.js';
import Mockup from '../../components/Mockup.jsx';
import { ConfirmButton, Empty, Loading, Modal, Pill, useMoney } from '../../components/ui.jsx';

const FILTERS = [['activos', 'Activos'], ['recibido', 'Nuevos'], ['revision', 'En revisión'], ['produccion', 'En producción'], ['listo', 'Listos'], ['entregado', 'Entregados'], ['todos', 'Todos']];

function exportCsv(list) {
  const rows = [['Código', 'Fecha', 'Cliente', 'Celular', 'Correo', 'Entrega', 'Dirección', 'Productos', 'Piezas', 'Total', 'Pagado', 'Pago', 'Estado', 'Fecha de entrega']];
  list.forEach((o) => rows.push([
    o.code, new Date(o.createdAt).toISOString().slice(0, 10), o.customer?.name, o.customer?.phone, o.customer?.email, o.delivery === 'envio' ? 'Envío' : 'Recoger',
    o.address, o.items.map((i) => `${i.name} x${i.qty}`).join(' | '), o.items.reduce((s, i) => s + i.qty, 0), o.total, o.paid || 0,
    (PAY[o.payStatus] || PAY.pendiente)[0], statusMeta(o.status)[1], o.dueDate
  ]));
  const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `pedidos-printly-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function OrderDetail({ o, onClose }) {
  const { settings: st, cur, toast } = useStore();
  const money = useMoney();
  const [f, setF] = useState({ status: o.status, dueDate: o.dueDate, paid: o.paid || 0, adminNotes: o.adminNotes || '' });
  const [saving, setSaving] = useState(false);
  const sm = statusMeta(o.status);

  async function save(e) {
    e.preventDefault(); setSaving(true);
    const paid = Math.max(0, Number(f.paid) || 0);
    const patch = { status: f.status, dueDate: f.dueDate || o.dueDate, paid, adminNotes: f.adminNotes,
      payStatus: paid >= o.total - 0.01 ? 'pagado' : paid > 0 ? 'anticipo' : 'pendiente' };
    if (f.status !== o.status) patch.history = [...(o.history || []), { status: f.status, at: Date.now() }];
    try { await updateOrder(o.id, patch); toast('Pedido actualizado'); onClose(); }
    catch { toast('No se pudo guardar el pedido.'); setSaving(false); }
  }
  async function remove() {
    try { await deleteOrder(o.id); toast('Pedido eliminado'); onClose(); } catch { toast('No se pudo eliminar el pedido.'); }
  }
  const msg = `Hola ${o.customer?.name || ''}, te escribimos de ${st.shopName || 'Printly'} por tu pedido ${o.code}.`;

  return (
    <Modal title={o.code} eyebrow={`Pedido ${fmtDateTime(o.createdAt)}`} onClose={onClose} wide>
      <div className="pills">
        <Pill tone={sm[2]}>{sm[1]}</Pill><Pill tone={(PAY[o.payStatus] || PAY.pendiente)[1]}>{(PAY[o.payStatus] || PAY.pendiente)[0]}</Pill>
        {o.rush && <Pill tone="bad">Urgente</Pill>}<Pill tone="muted">{o.payChoice === 'online' ? 'Mercado Pago' : o.payMethod}</Pill>
      </div>
      <div className="card stack-sm">
        <h3>{o.customer?.name}</h3>
        <div className="row-wrap"><span className="num">{o.customer?.phone}</span><a className="btn sm" href={waLink(o.customer?.phone, msg)} target="_blank" rel="noopener">WhatsApp</a></div>
        {o.customer?.email && <span>{o.customer.email}</span>}
        <span>{o.delivery === 'envio' ? `Envío a: ${o.address}` : 'Recoge en tienda'}</span>
        {o.notes && <span><b>Comentarios:</b> {o.notes}</span>}
        {o.mp?.paymentId && <span className="muted small">Mercado Pago #{o.mp.paymentId} · {o.mp.status}</span>}
        {o.paypal?.captureId && <span className="muted small">PayPal #{o.paypal.captureId} · {o.paypal.status}{o.paypal.payer ? ` · ${o.paypal.payer}` : ''}</span>}
      </div>
      {o.items.map((i, k) => (
        <div className="card stack-sm" key={k}>
          <div className="item-detail">
            <div className="mini"><Mockup item={i} /></div>
            <div className="stack-xs">
              <h3>{i.name} ×{i.qty}</h3>
              <span>{i.mat?.name} · {i.tech?.name}{i.color && <> · <span className="swatch-sm" style={{ background: i.color.hex }} /> {i.color.name}</>}</span>
              {i.sizes && <span><b>Tallas:</b> {Object.entries(i.sizes).map(([s, n]) => `${s}×${n}`).join(' · ')}</span>}
              {i.text && <span><b>Texto:</b> “{i.text}” ({FONTS[i.textFont]?.label}, {AREA_NAMES[i.textZone] || i.textZone}) <span className="swatch-sm" style={{ background: i.textColor }} /></span>}
              {i.designHelp && <span><b>Diseña Printly</b></span>}
              {i.notes && <span><b>Indicaciones:</b> {i.notes}</span>}
              <span className="muted num">{money(i.unit)} c/u{i.design ? ` + diseño ${money(i.design)}` : ''} = {money(i.line)}</span>
            </div>
          </div>
          <div className="designs">
            {i.zones.map((z) => (
              <div className="design" key={z.key}>
                {z.img ? <img src={z.img} alt={`Diseño ${z.label}`} /> : <div className="noimg">Sin imagen</div>}
                <b>{z.label}</b>
                {z.name && <span className="muted wrap-any">{z.name} · {z.w}×{z.h}px</span>}
                {z.img && <a className="btn sm" href={z.img} download={`${o.code}-${z.label}.webp`.replace(/\s+/g, '-')}>Descargar</a>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="card stack-sm">
        <div className="line"><span>Subtotal</span><span className="num">{money(o.sub)}</span></div>
        {o.disc > 0 && <div className="line"><span>Descuento {o.discPct}%</span><span className="num">−{money(o.disc)}</span></div>}
        {o.rushFee > 0 && <div className="line"><span>Urgencia</span><span className="num">{money(o.rushFee)}</span></div>}
        {o.ship > 0 && <div className="line"><span>Envío</span><span className="num">{money(o.ship)}</span></div>}
        <div className="line total"><span>Total</span><span className="num">{money(o.total)}</span></div>
        <div className="line"><span>Pagado</span><span className="num">{money(o.paid || 0)} · saldo {money(o.total - (o.paid || 0))}</span></div>
      </div>
      <form className="card stack" onSubmit={save}>
        <h3>Gestionar</h3>
        <div className="row">
          <label className="f">Estado<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUSES.map((s) => <option key={s[0]} value={s[0]}>{s[1]}</option>)}</select></label>
          <label className="f">Fecha de entrega<input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></label>
        </div>
        <div className="row align-end">
          <label className="f">Monto pagado ({cur} MXN)<input type="number" step="0.01" min="0" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} /></label>
          <div className="row-wrap"><button type="button" className="btn sm" onClick={() => setF({ ...f, paid: o.deposit })}>Anticipo {money(o.deposit)}</button><button type="button" className="btn sm" onClick={() => setF({ ...f, paid: o.total })}>Total</button></div>
        </div>
        <label className="f">Notas internas<textarea value={f.adminNotes} onChange={(e) => setF({ ...f, adminNotes: e.target.value })} placeholder="Solo las ve el equipo" /></label>
        <div className="row-between"><button className="btn primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar pedido'}</button><ConfirmButton onConfirm={remove} confirmLabel="¿Eliminar definitivamente?">Eliminar pedido</ConfirmButton></div>
      </form>
      <div className="hist"><h3>Historial</h3>{(o.history || []).slice().reverse().map((h, k) => <div key={k}><span className="muted num">{fmtDateTime(h.at)}</span><span>{statusMeta(h.status)[1]}</span></div>)}</div>
    </Modal>
  );
}

export default function Orders() {
  const { toast } = useStore();
  const money = useMoney();
  const [all, setAll] = useState(null);
  const [filter, setFilter] = useState('activos');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  useEffect(() => subscribeAllOrders(setAll, (e) => { console.error(e); toast('No se pudieron leer los pedidos. Revisa las reglas de Firestore.'); setAll([]); }), [toast]);

  const today = new Date().toISOString().slice(0, 10);
  const k = useMemo(() => {
    if (!all) return null;
    const active = all.filter((o) => !['entregado', 'cancelado'].includes(o.status));
    const m = new Date(); m.setDate(1); m.setHours(0, 0, 0, 0);
    return {
      active, nuevos: all.filter((o) => o.status === 'recibido').length, prod: all.filter((o) => ['aprobado', 'produccion'].includes(o.status)).length,
      listos: all.filter((o) => o.status === 'listo').length, cobrar: active.reduce((s, o) => s + Math.max(0, o.total - (o.paid || 0)), 0),
      mes: all.filter((o) => o.createdAt >= m.getTime() && o.status !== 'cancelado').reduce((s, o) => s + o.total, 0)
    };
  }, [all]);
  if (!all) return <Loading label="Cargando pedidos…" />;

  let list = filter === 'todos' ? all : filter === 'activos' ? k.active : filter === 'produccion' ? all.filter((o) => ['aprobado', 'produccion'].includes(o.status)) : all.filter((o) => o.status === filter);
  if (q) list = list.filter((o) => `${o.code} ${o.customer?.name} ${o.customer?.phone}`.toLowerCase().includes(q.toLowerCase()));
  const open = all.find((o) => o.id === openId);

  return (
    <>
      <div className="kpis">
        <div className="kpi"><b>{k.nuevos}</b><span>Pedidos nuevos</span></div>
        <div className="kpi"><b>{k.prod}</b><span>Aprobados o en producción</span></div>
        <div className="kpi"><b>{k.listos}</b><span>Listos para entregar</span></div>
        <div className="kpi"><b className="num sm">{money(k.cobrar)}</b><span>Por cobrar · {money(k.mes)} vendidos este mes</span></div>
      </div>
      <div className="toolbar">
        <div className="chips">{FILTERS.map(([v, l]) => <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}</div>
        <input type="search" placeholder="Buscar código, cliente o celular" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedidos" />
        <button className="btn sm" onClick={() => exportCsv(list)} disabled={!list.length}>Exportar CSV</button>
      </div>
      {list.length ? (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Código</th><th>Cliente</th><th>Productos</th><th>Entrega</th><th>Estado</th><th>Pago</th><th className="r">Total</th></tr></thead>
            <tbody>
              {list.map((o) => {
                const sm = statusMeta(o.status);
                const late = o.dueDate < today && !['entregado', 'cancelado', 'listo'].includes(o.status);
                return (
                  <tr key={o.id} className="click" tabIndex={0} onClick={() => setOpenId(o.id)} onKeyDown={(e) => e.key === 'Enter' && setOpenId(o.id)}>
                    <td><b>{o.code}</b>{o.rush && <> <Pill tone="bad">Urgente</Pill></>}<div className="muted small">{fmtDate(o.createdAt)}</div></td>
                    <td>{o.customer?.name}<div className="muted small num">{o.customer?.phone}</div></td>
                    <td className="small">{o.items.map((i, n) => <div key={n}>{i.name} ×{i.qty}</div>)}</td>
                    <td className={late ? 'late' : ''}>{fmtDate(o.dueDate + 'T12:00')}{late && <div className="small">Atrasado</div>}<div className="muted small fw4">{o.delivery === 'envio' ? 'Envío' : 'Recoge'}</div></td>
                    <td><Pill tone={sm[2]}>{sm[1]}</Pill></td>
                    <td><Pill tone={(PAY[o.payStatus] || PAY.pendiente)[1]}>{(PAY[o.payStatus] || PAY.pendiente)[0]}</Pill></td>
                    <td className="num r b">{money(o.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty>{all.length ? 'Ningún pedido coincide con este filtro.' : 'Todavía no llegan pedidos. Cuando un cliente compre, aparecerá aquí al instante.'}</Empty>}
      {open && <OrderDetail o={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
