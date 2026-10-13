const STAGES=['Nuevo','Contactado','Seguimiento','Presupuesto enviado','Reservado','Facturado','Perdido'];
const STAGE_COL={'Contactado':'fechaContactado','Seguimiento':'fechaSeguimiento','Presupuesto enviado':'fechaPresupuesto','Reservado':'fechaReservado','Facturado':'fechaFacturado','Perdido':'fechaPerdido'};
// Estado de pago de los Facturados (pestaña Facturación): [color, fecha que cuenta, verbo]
const PAGOS={'Pendiente de pago':['--pay-pend','fechaFacturado','facturados'],'Pagado':['--pay-ok','fechaPagado','cobrados']};
const pagoTag=l=>l.etapa==='Facturado'&&PAGOS[l.estadoPago]?`<span class="temp" style="--tc:var(${l.estadoPago==='Pagado'?'--t-hot':'--t-warm'})">${l.estadoPago}</span>`:'';
const USOS=['Agua','Purín','Abono'];
const TIPOS=['Llamada','Mensaje','Correo','Instalación','Enviar presupuesto','Enviar factura'];
const DURACIONES=[['15','15 min'],['30','30 min'],['45','45 min'],['60','1 hora'],['90','1 h 30'],['120','2 horas']];
const ORIGENES=['Meta Ads','Teléfono','Recomendación','Otro'];
const MOTIVOS=['Precio','Compró a otro proveedor','No tiene espacio','No responde','Ya no lo necesita','Otro'];
const STATUS={vencido:['Vencido','--vencido'],porvencer:['Por vencer','--porvencer'],trabajar:['Por trabajar','--trabajar'],aldia:['Al día','--aldia'],cerrado:['Cerrado','--cerrado']};
const usoIcon={Agua:'💧',Purín:'🟤',Abono:'🌱'};
// Temperatura del lead (catalogación comercial)
const TEMPS={'Caliente':['--t-hot','Posible venta'],'Templado':['--t-warm','Interés moderado'],'Frío':['--t-cold','Poco interés'],'Descartado':['--t-out','No seguir']};
// ───── importes y recibos ─────
const FORMAS_PAGO=['Transferencia','Bizum','Tarjeta','Efectivo','Financiación'];
// Idioma y formatos (la demo es bilingüe; la moneda, el impuesto y el documento fiscal vienen de la configuración)
let LANG=(window.YK_LANG||'es'),LOCALE=LANG==='en'?'en-US':'es-ES';
const NUM_LOCALE=LANG==='en'?'en-US':'es-US'; // importes al estilo latinoamericano: $12,500.00
// Acepta "1.234,50", "1234.5", "1.000" (mil) o "1000"
const toNum=s=>{let t=String(s||'').replace(/[^\d.,-]/g,'');if(/,\d{1,2}$/.test(t)||/^\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,'').replace(',','.');else t=t.replace(/,/g,'');const n=Number(t);return isFinite(n)?n:0};
const money=n=>n.toLocaleString(NUM_LOCALE,{style:'currency',currency:(DATA.config&&DATA.config.moneda)||'USD'});
const eur=money; // compatibilidad con el código original
const taxName=()=>(DATA.config&&DATA.config.impuestoNombre)||'IVA';
const docName=()=>(DATA.config&&DATA.config.docFiscal)||'NIF';
const fdate=s=>{const d=pd(s);return d?d.toLocaleDateString(LOCALE):'—'};
/** Base, IVA y total de un lead (IVA del lead o, si no tiene, el de la empresa). */
function totales(l){const cfg=DATA.config||{},base=toNum(l.factImporte),iva=l.factIva!==''&&l.factIva!=null?toNum(l.factIva):toNum(cfg.ivaDefecto);
  const cuota=Math.round(base*iva)/100;return {base,iva,cuota,total:Math.round((base+cuota)*100)/100,hayImporte:!!String(l.factImporte||'').trim()}}
/** Texto plano del recibo, para email y WhatsApp. */
function reciboTexto(l){const cfg=DATA.config||{},t=totales(l),pag=l.estadoPago==='Pagado';
  return [`Recibo ${l.factNumero||''}${cfg.empresaNombre?' · '+cfg.empresaNombre:''}`,`Fecha: ${fdate(l.factFecha)}`,'',
    `Cliente: ${l.factNombre||l.nombre}${l.factNif?' ('+l.factNif+')':''}`,`Concepto: ${l.factConcepto||'Depósito'+(l.uso?' para '+l.uso.toLowerCase():'')}`,'',
    `Base imponible: ${eur(t.base)}`,`${taxName()} ${t.iva.toLocaleString(NUM_LOCALE)}%: ${eur(t.cuota)}`,`TOTAL: ${eur(t.total)}`,'',
    `Estado: ${pag?'PAGADO el '+fdate(l.fechaPagado):'Pendiente de pago'}`+(l.factFormaPago?` · ${l.factFormaPago}`:''),
    cfg.pieRecibo?'\n'+cfg.pieRecibo:''].join('\n').trim().split('\n').map(x=>LANG==='en'&&window.YK_tr?YK_tr(x):x).join('\n')}
/** Teléfono para WhatsApp: solo dígitos; si es un número local se le antepone el prefijo del país configurado. */
const waPhone=t=>{let d=String(t||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);const pre=String((DATA.config&&DATA.config.prefijoTel)||'');
  if(pre&&d.length<=9&&!d.startsWith(pre))d=pre+d;return d};
const tempTag=t=>TEMPS[t]?`<span class="temp" style="--tc:var(${TEMPS[t][0]})" title="${TEMPS[t][1]}">${t}</span>`:'';
const ICON={
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>',
  // Logo de la app: círculo blanco › círculo negro algo más pequeño › círculo blanco mucho más pequeño (en tema claro, invertido)
  logo:'<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="18" fill="var(--hi-bg)"/><circle cx="18" cy="18" r="12.5" fill="var(--hi-text)"/><circle cx="18" cy="18" r="4.5" fill="var(--hi-bg)"/></svg>',
};

let DATA={hoy:'',leads:[],citas:[],historial:[],movimientos:[],config:{}};
let T=new Date();T.setHours(0,0,0,0);
let filtro='todos', tfiltro='', q='', fichaId=null, nuevoUso='', nuevaTemp='';

// ───── utilidades ─────
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pd=s=>{const [y,m,d]=String(s||'').slice(0,10).split('-').map(Number);return y&&m&&d?new Date(y,m-1,d):null};
const iso=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
const fmt=x=>x?x.toLocaleDateString(LOCALE,{day:'2-digit',month:'short'}).replace('.',''):'—';
const ini=n=>String(n).trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
const lead=id=>DATA.leads.find(l=>l.id===id);
const cerrado=l=>l.etapa==='Facturado'||l.etapa==='Perdido';
const mondayOf=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const hm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const toMin=h=>{const [a,b]=String(h||'').split(':').map(Number);return isNaN(a)?null:a*60+(b||0)};
document.querySelectorAll('[data-ico]').forEach(e=>e.innerHTML=ICON[e.dataset.ico]);
$('brandSide').innerHTML=ICON.logo;

// DEMO: el "servidor" es un simulador en memoria (js/backend.js) con datos ficticios. No se guarda nada.
async function api(fn,...args){
  document.body.classList.add('busy');
  await new Promise(r=>setTimeout(r,180));
  try{return JSON.parse(JSON.stringify(DemoBackend[fn](...args)))}
  catch(e){toast(e.message||'Error',true);throw e}
  finally{document.body.classList.remove('busy')}
}
function toast(msg,err){const t=$('toast');t.textContent=(err?'⚠ ':'✓ ')+msg;t.classList.toggle('err',!!err);t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),err?4500:2400)}
function setData(d,changedId){DATA=d;DATA.movimientos=DATA.movimientos||[];DATA.config=DATA.config||{};T=pd(d.hoy)||T;applyMe(d.yo);flashId=changedId||null;renderAll();flashId=null;fillConfig()}
/** Nombre, rol y menú según el usuario. (Solo estética: los permisos los aplica el servidor.) */
function applyMe(yo){
  if(!yo)return;
  const admin=yo.rol==='admin';
  document.body.classList.toggle('is-admin',admin);
  $('userName').textContent=yo.nombre||'';
  $('userEmail').textContent=yo.email||'';
  $('userRole').textContent=admin?'Administrador':'Usuario';
  $('userRole').classList.toggle('admin',admin);
  $('meAvatar').textContent=ini(yo.nombre||yo.email||'?');
  $('meAvatar').title=(yo.nombre||'')+' · '+(admin?'Administrador':'Usuario');
  $('greet').textContent=`Hola, ${String(yo.nombre||'').split(/\s+/)[0]||''}! 👋`;
  const v=document.querySelector('.view.active');
  if(!admin&&v&&(v.id==='v-usuarios'||v.id==='v-registro'))ACTIONS.nav(document.querySelector('.nav[data-view=dashboard]'));
}

// ───── animación ─────
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
let flashId=null; // lead recién modificado: se ilumina una vez en tabla, pipeline y agenda
/** Aparición escalonada de los hijos de un contenedor (solo al entrar en una pantalla). */
function enter(...ids){
  ids.forEach(id=>{const el=$(id);if(!el)return;
    [...el.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,16)));
    el.querySelectorAll('.col').forEach((col,ci)=>col.querySelectorAll('.kcard').forEach((k,i)=>k.style.setProperty('--i',Math.min(ci+i+1,16))));
    el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');
    clearTimeout(el._e);el._e=setTimeout(()=>el.classList.remove('enter'),1500);});
}
const VIEW_PARTS={dashboard:['kpis','progChart','bento2','todayList','funnel','tbody'],pipeline:['stageCards','kanban'],facturacion:['payCards','kanbanPago'],calendario:['cal'],usuarios:['usersBody'],registro:['auditBody']};
function countTo(el,to){
  const from=+el.textContent||0;cancelAnimationFrame(el._r);
  if(from===to||REDUCED||document.hidden){el.textContent=to;return} // en segundo plano no hay animación: valor directo
  const t0=performance.now(),d=550;
  const step=t=>{const p=Math.min(1,(t-t0)/d);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));
    if(p<1)el._r=requestAnimationFrame(step);else{const k=el.closest('.kpi');if(k){k.classList.remove('bump');void k.offsetWidth;k.classList.add('bump')}}};
  el._r=requestAnimationFrame(step);
}
function showOv(id){const o=$(id);clearTimeout(o._c);o.classList.remove('closing');o.classList.add('open')}
function hideOv(id){const o=$(id);if(!o.classList.contains('open'))return;
  if(REDUCED){o.classList.remove('open');return}
  o.classList.add('closing');clearTimeout(o._c);o._c=setTimeout(()=>o.classList.remove('open','closing'),180)}

// ───── estados ─────
const citasDe=id=>DATA.citas.filter(c=>c.leadId===id&&!c.hecha).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
const proxima=l=>citasDe(l.id)[0];
function citaStatus(c){const diff=(pd(c.fecha)-T)/864e5;return diff<0?'vencido':diff<=1?'porvencer':'aldia'}
function status(l){if(cerrado(l))return 'cerrado';const c=proxima(l);return c?citaStatus(c):'trabajar'}
const match=l=>!q||[l.nombre,l.telefono,l.email].join(' ').toLowerCase().includes(q);
/** Color pastel propio de cada etapa (--st-1…--st-7). */
const stStyle=s=>{const i=STAGES.indexOf(s)+1;return i?`--sc:var(--st-${i})`:''};
/** Fecha (con hora si la hay) en que el lead entró en una etapa. */
const stageDate=(l,s)=>s==='Nuevo'?l.fechaIngreso:l[STAGE_COL[s]]||'';

// ───── render general ─────
function renderAll(){
  $('today').textContent='Hoy, '+T.toLocaleDateString(LOCALE,{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
  for(const k of ['vencido','porvencer','trabajar','aldia'])countTo($('k-'+k),DATA.leads.filter(l=>status(l)===k).length);
  renderBig();renderDonut();renderHoy();renderFunnel();renderFilters();renderTable();
  renderStageCards();renderKanban();renderPagos();renderCal();renderProgress();
}

function renderBig(){
  const abiertos=DATA.leads.filter(l=>!cerrado(l)),sinCita=abiertos.filter(l=>status(l)==='trabajar').length;
  const hoy=iso(T),hoyN=DATA.citas.filter(c=>!c.hecha&&c.fecha===hoy&&lead(c.leadId)).length;
  const venc=DATA.citas.filter(c=>!c.hecha&&c.fecha<hoy&&lead(c.leadId)&&!cerrado(lead(c.leadId))).length;
  $('bigLeads').innerHTML=`<div class="ico">${ICON.check}</div><div><div class="val">${abiertos.length}<small>leads activos</small></div>
    <p>${!abiertos.length?'Aún no hay leads activos. Crea uno con “Nuevo lead”.'
      :sinCita?`${sinCita} ${sinCita===1?'lead está':'leads están'} <em>esperando</em> que se les agende una cita.`:'Todos los leads activos tienen una cita agendada.'}</p></div>`;
  $('bigCitas').innerHTML=`<div class="ico">${ICON.cal}</div><div><div class="val">${hoyN}<small>${hoyN===1?'cita hoy':'citas hoy'}</small></div>
    <p>${venc?`${venc} ${venc===1?'cita está <em>vencida</em>':'citas están <em>vencidas</em>'} sin realizar.`:'No hay citas vencidas. ¡Bien!'}</p></div>`;
}

/** Dona de leads por uso (3 categorías + sin definir), con hueco de 2px entre segmentos. */
function renderDonut(){
  const cats=[['Agua','var(--st-1)'],['Purín','var(--st-2)'],['Abono','var(--st-6)'],['Sin definir','var(--card-3)']];
  const n=cats.map(([c])=>DATA.leads.filter(l=>(l.uso||'Sin definir')===c).length),tot=n.reduce((a,b)=>a+b,0);
  const R=62,C=2*Math.PI*R;let acc=0;
  const arcs=tot?cats.map(([c,col],i)=>{const f=n[i]/tot;if(!f)return '';const len=Math.max(0,f*C-3),off=-acc*C;acc+=f;
    return `<circle class="seg-arc" r="${R}" cx="85" cy="85" fill="none" stroke="${col}" stroke-width="24" stroke-dasharray="${len} ${C}" stroke-dashoffset="${off}" style="--len:${len}" transform="rotate(-90 85 85)"><title>${c}: ${n[i]} (${Math.round(f*100)}%)</title></circle>`}).join('')
    :`<circle r="${R}" cx="85" cy="85" fill="none" stroke="var(--card-2)" stroke-width="24"/>`;
  $('donut').innerHTML=`<svg viewBox="0 0 170 170" role="img" aria-label="Leads por uso">${arcs}
    <text x="85" y="82" text-anchor="middle" style="font:800 30px 'Plus Jakarta Sans';fill:var(--text)">${tot}</text>
    <text x="85" y="104" text-anchor="middle" style="font:600 12px 'Plus Jakarta Sans';fill:var(--faint)">leads</text></svg>
    <div class="legend-list">${cats.map(([c,col],i)=>`<span><i class="dot" style="--c:${col}"></i>${c==='Sin definir'?c:(usoIcon[c]+' '+c)}<b>${tot?Math.round(n[i]/tot*100):0}%</b></span>`).join('')}</div>`;
}

function renderHoy(){
  const hoy=iso(T);
  const cs=DATA.citas.filter(c=>!c.hecha&&c.fecha<=hoy&&lead(c.leadId)&&!cerrado(lead(c.leadId)))
    .sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
  $('todayList').innerHTML=cs.map(c=>{const l=lead(c.leadId),late=c.fecha<hoy;return `
    <div class="call ${l.id===flashId?'flash':''}" data-act="lead" data-id="${esc(l.id)}" style="${stStyle(l.etapa)}"><div class="avatar">${esc(ini(l.nombre))}</div>
    <div class="who"><b>${esc(l.nombre)}</b><span>${esc(c.tipo)} · ${esc(l.etapa)}${l.uso?' · '+usoIcon[l.uso]+' '+esc(l.uso):''} · ${esc(l.telefono)}</span></div>
    <span class="time ${late?'late':''}">${late?fmt(pd(c.fecha)):esc(c.hora||'—')}</span></div>`}).join('')
    ||'<p class="empty">Sin llamadas pendientes para hoy 🎉</p>';
}
function renderFunnel(){
  const n=s=>DATA.leads.filter(l=>l.etapa===s).length, max=Math.max(1,...STAGES.map(n));
  $('funnel').innerHTML=STAGES.map(s=>`<div class="frow" style="${stStyle(s)}"><span class="stage">${s}</span><div class="bar"><i style="width:${n(s)/max*100}%"></i></div><b>${n(s)}</b></div>`).join('');
}
function renderFilters(){
  const opts=[['todos','Todos',null],...Object.entries(STATUS).map(([k,v])=>[k,v[0],v[1]])];
  $('filters').innerHTML=opts.map(([k,lbl,c])=>`<button class="chip ${filtro===k?'on':''}" data-act="filtro" data-f="${k}">${c?`<i class="dot" style="--c:var(${c})"></i>`:''}${lbl}</button>`).join('')
    +'<span class="sep"></span>'
    +Object.entries(TEMPS).map(([t,[c]])=>`<button class="chip ${tfiltro===t?'on':''}" data-act="tfiltro" data-f="${t}"><i class="dot" style="--c:var(${c})"></i>${t}</button>`).join('');
}
function renderTable(){
  const order={vencido:0,porvencer:1,trabajar:2,aldia:3,cerrado:4};
  const key=l=>{const c=proxima(l);return c?c.fecha+' '+c.hora:l.fechaIngreso};
  const rows=DATA.leads.filter(l=>(filtro==='todos'||status(l)===filtro)&&(!tfiltro||l.temperatura===tfiltro)&&match(l))
    .sort((a,b)=>order[status(a)]-order[status(b)]||key(a).localeCompare(key(b)));
  $('tableCount').textContent=`${rows.length} de ${DATA.leads.length} leads · ordenados por urgencia y fecha`;
  $('tbody').innerHTML=rows.map(l=>{const s=status(l),c=proxima(l);return `
    <tr class="row ${s} ${l.id===flashId?'flash':''}" style="--c:var(${STATUS[s][1]})" data-act="lead" data-id="${esc(l.id)}">
      <td><b>${esc(l.nombre)}</b><small>${esc(l.telefono)||'—'}</small></td>
      <td>${tempTag(l.temperatura)||'<span class="muted-s">—</span>'}</td>
      <td>${fmt(pd(l.fechaIngreso))}</td>
      <td>${l.uso?usoIcon[l.uso]+' '+esc(l.uso):'—'}</td>
      <td><span class="stage" style="${stStyle(l.etapa)}">${esc(l.etapa)}</span></td>
      <td>${c?fmt(pd(c.fecha))+(c.hora?' · '+esc(c.hora):''):'—'}</td>
      <td><span class="spill"><i class="dot"></i>${STATUS[s][0]}</span></td></tr>`}).join('');
  $('tableEmpty').innerHTML=rows.length?'':`<p class="empty">${DATA.leads.length?'Ningún lead coincide con el filtro.':'Aún no hay leads. Pulsa “Nuevo lead” para crear el primero.'}</p>`;
}

// ───── pipeline ─────
/** Tarjetas resumen por etapa: leads actuales + entradas en la etapa esta semana frente a la anterior. */
function renderStageCards(){
  const w0=mondayOf(T),w1=addDays(w0,7),p0=addDays(w0,-7);
  const ent=(s,a,b)=>DATA.movimientos.filter(m=>m.a===s&&(d=>d&&d>=a&&d<b)(pd(m.fecha))).length;
  $('stageCards').innerHTML=STAGES.map(s=>{const n=DATA.leads.filter(l=>l.etapa===s).length,est=ent(s,w0,w1),ant=ent(s,p0,w0),d=est-ant;
    return `<div class="scard" style="${stStyle(s)}"><div class="band">${s}</div><div class="body"><b>${n}</b>
      <span class="pill ${d>0?'up':d<0?'down':''}">${d>0?'▲':d<0?'▼':'='} ${est} esta sem.</span><small>${ant} entraron la semana pasada</small></div></div>`}).join('');
}
function renderKanban(){
  $('kanban').innerHTML=STAGES.map(s=>{const ls=DATA.leads.filter(l=>l.etapa===s&&match(l));return `
    <div class="col" data-etapa="${s}" style="${stStyle(s)}"><h3>${s}<span>${ls.length}</span></h3><div class="cards">${ls.map(l=>{const st=status(l),c=proxima(l),since=pd(stageDate(l,s));
      const dias=since?Math.round((T-since)/864e5):null;return `
      <div class="kcard ${l.id===flashId?'flash':''}" draggable="true" style="--c:var(${STATUS[st][1]})" data-act="${l.etapa==='Facturado'?'recibo':'lead'}" data-id="${esc(l.id)}" title="${l.etapa==='Facturado'?'Ver recibo':'Abrir ficha'}"><b>${esc(l.nombre)}</b>
      <small><span>${l.uso?usoIcon[l.uso]+' '+esc(l.uso):'—'}${dias!==null?` · ${dias===0?'hoy':dias+' d'} aquí`:''}</span><span style="color:var(${STATUS[st][1]})">${c?fmt(pd(c.fecha)):STATUS[st][0]}</span></small>${tempTag(l.temperatura)||pagoTag(l)?`<div class="meta" style="margin-top:8px">${tempTag(l.temperatura)}${pagoTag(l)}</div>`:''}</div>`}).join('')}</div></div>`}).join('');
}

// ───── facturación (Facturados divididos por estado de pago) ─────
function renderPagos(){
  const fact=DATA.leads.filter(l=>l.etapa==='Facturado'),w0=mondayOf(T),w1=addDays(w0,7),p0=addDays(w0,-7);
  const enRango=(d,a,b)=>d&&d>=a&&d<b;
  $('payCards').innerHTML=Object.entries(PAGOS).map(([p,[c,campo,verbo]])=>{
    const ls=fact.filter(l=>(l.estadoPago||'Pendiente de pago')===p);
    // Entradas de la semana: facturados (pendientes) o cobrados (pagados) esta semana frente a la anterior
    const base=p==='Pagado'?ls:fact,est=base.filter(l=>enRango(pd(l[campo]),w0,w1)).length,ant=base.filter(l=>enRango(pd(l[campo]),p0,w0)).length,d=est-ant;
    return `<div class="scard" style="--sc:var(${c})"><div class="band">${p}</div><div class="body"><b>${ls.length}</b>
      <span class="pill ${d>0?'up':d<0?'down':''}">${d>0?'▲':d<0?'▼':'='} ${est} ${est===1?verbo.slice(0,-1):verbo} esta sem.</span><small>${ant} ${ant===1?verbo.slice(0,-1):verbo} la semana pasada</small></div></div>`}).join('');
  $('kanbanPago').innerHTML=Object.entries(PAGOS).map(([p,[c]])=>{const ls=fact.filter(l=>(l.estadoPago||'Pendiente de pago')===p&&match(l))
      .sort((a,b)=>String(b.fechaPagado||b.fechaFacturado).localeCompare(String(a.fechaPagado||a.fechaFacturado)));return `
    <div class="col" data-pago="${p}" style="--sc:var(${c})"><h3>${p}<span>${ls.length}</span></h3><div class="cards">${ls.map(l=>{
      const f=pd(p==='Pagado'?l.fechaPagado:l.fechaFacturado),dias=f?Math.round((T-f)/864e5):null;return `
      <div class="kcard ${l.id===flashId?'flash':''}" draggable="true" style="--c:var(${c})" data-act="recibo" data-id="${esc(l.id)}" title="Ver recibo"><b>${esc(l.nombre)}</b>
      <div class="precio">${totales(l).hayImporte?eur(totales(l).total):l.precio?esc(l.precio):'<span class="muted-s" style="font-weight:600">Sin importe</span>'}${l.factNumero?` <span class="muted-s" style="font-weight:600">· ${esc(l.factNumero)}</span>`:''}</div>
      <small><span>${l.uso?usoIcon[l.uso]+' '+esc(l.uso):'—'}</span><span>${p==='Pagado'?'Cobrado':'Facturado'} ${f?fmt(f)+(dias>0?` · ${dias} d`:''):'—'}</span></small>
      ${l.temperatura?`<div class="meta" style="margin-top:8px">${tempTag(l.temperatura)}</div>`:''}</div>`}).join('')
      ||'<p class="empty" style="padding:6px 4px">Sin leads aquí.</p>'}</div></div>`}).join('');
}

// ───── progreso ─────
let progMetric='ventas',progPeriod='semana';
const DOW=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const AVG_WEEKS=8;
// [plural, plural corto, leyenda, singular]
const METRIC={nuevos:['leads nuevos','nuevos','Leads nuevos','lead nuevo'],ventas:['leads facturados','facturados','Leads facturados','lead facturado'],
  pagados:['leads pagados','pagados','Leads pagados','lead pagado'],
  perdidos:['leads perdidos','perdidos','Leads perdidos','lead perdido'],citas:['citas realizadas','citas','Citas realizadas','cita realizada']};
/** Fechas de cada evento: creación del lead, paso a Facturado / Perdido, pago registrado o cita realizada. */
function progEvents(){
  if(progMetric==='nuevos')return DATA.leads.map(l=>pd(l.fechaIngreso)).filter(Boolean);
  if(progMetric==='ventas')return DATA.leads.filter(l=>l.etapa==='Facturado').map(l=>pd(l.fechaFacturado)||pd(l.actualizado)).filter(Boolean);
  if(progMetric==='pagados')return DATA.leads.filter(l=>l.etapa==='Facturado'&&l.estadoPago==='Pagado').map(l=>pd(l.fechaPagado)||pd(l.actualizado)).filter(Boolean);
  if(progMetric==='perdidos')return DATA.leads.filter(l=>l.etapa==='Perdido').map(l=>pd(l.fechaPerdido)||pd(l.actualizado)).filter(Boolean);
  return DATA.citas.filter(c=>c.hecha).map(c=>pd(c.hechaEl)||pd(c.fecha)).filter(Boolean);
}
function progSeries(){
  const ev=progEvents(),wk0=mondayOf(T);
  if(progPeriod==='semana')return {slots:Array.from({length:12},(_,i)=>{const a=addDays(wk0,-7*(11-i)),b=addDays(a,7);
      return {label:fmt(a),tip:'Semana del '+fmt(a),v:ev.filter(d=>d>=a&&d<b).length,cur:i===11}}),unit:'esta semana',prevUnit:'frente a la semana anterior'};
  if(progPeriod==='mes')return {slots:Array.from({length:12},(_,i)=>{const a=new Date(T.getFullYear(),T.getMonth()-(11-i),1),b=new Date(a.getFullYear(),a.getMonth()+1,1);
      return {label:a.toLocaleDateString(LOCALE,{month:'short'}).replace('.',''),tip:cap(a.toLocaleDateString(LOCALE,{month:'long',year:'numeric'})),v:ev.filter(d=>d>=a&&d<b).length,cur:i===11}}),unit:'este mes',prevUnit:'frente al mes anterior'};
  // Día de la semana: barras = esta semana (lunes a domingo); línea = promedio de las 8 semanas anteriores
  return {slots:DOW.map((n,i)=>{const day=addDays(wk0,i),nxt=addDays(day,1);
    let sum=0;for(let w=1;w<=AVG_WEEKS;w++){const a=addDays(day,-7*w),b=addDays(a,1);sum+=ev.filter(d=>d>=a&&d<b).length}
    return {label:n,tip:cap(day.toLocaleDateString(LOCALE,{weekday:'long',day:'numeric',month:'short'})),v:ev.filter(d=>d>=day&&d<nxt).length,
      avg:sum/AVG_WEEKS,cur:iso(day)===iso(T),future:day>T}}),unit:'esta semana',prevUnit:`frente al promedio semanal de las ${AVG_WEEKS} anteriores`,weekday:true};
}
function niceMax(v){if(v<=4)return 4;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return (n<=2?2:n<=5?5:10)*p}
function renderProgress(){
  const box=$('progChart');if(!box)return;
  const S=progSeries(),sl=S.slots,M=METRIC[progMetric],color='var(--accent)';
  const cur=S.weekday?sl.reduce((a,s)=>a+s.v,0):sl[sl.length-1].v;
  const prev=S.weekday?sl.reduce((a,s)=>a+s.avg,0):sl[sl.length-2].v;
  const diff=cur-prev,pct=prev?Math.round(diff/prev*100):null;
  // En "perdidos" subir es malo: el color de la etiqueta se invierte.
  const good=progMetric==='perdidos'?diff<=0:diff>=0;
  $('progSum').innerHTML=`<b>${cur}</b><span>${cur===1?M[3]:M[0]} ${S.unit}</span>
    ${prev||cur?`<span class="pill ${good?'up':'down'}">${diff>=0?'▲':'▼'} ${pct===null?'nuevo':Math.abs(pct)+'%'}</span><span>${S.prevUnit} (${Math.round(prev*10)/10})</span>`:''}`;
  const W=Math.max(300,box.clientWidth||600),H=250,pl=34,pr=6,pt=24,pb=30,iw=W-pl-pr,ih=H-pt-pb;
  const max=niceMax(Math.max(1,...sl.map(s=>Math.max(s.v,s.avg||0))));
  const y=v=>pt+ih-(v/max)*ih,slotW=iw/sl.length,bw=Math.min(44,slotW*.62);
  const step=max%4===0?max/4:max/5,ticks=[];for(let t=0;t<=max;t+=step)ticks.push(t);
  // Etiquetas del eje X: si no caben todas (móvil), se muestra una de cada N, contando
  // hacia atrás desde la última para que la del periodo actual siempre se vea.
  const labelW=Math.max(...sl.map(s=>s.label.length))*7.5+10,every=Math.max(1,Math.ceil(labelW/slotW));
  const showLabel=i=>(sl.length-1-i)%every===0;
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc([...$('progSum').children].map(c=>LANG==='en'&&window.YK_tr?YK_tr(c.textContent):c.textContent).join(' ').replace(/\s+/g,' '))}">
    <g class="grid">${ticks.map(t=>`<line x1="${pl}" x2="${W-pr}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pl-8}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('')}</g>`;
  sl.forEach((s,i)=>{
    const cx=pl+slotW*i+slotW/2,h=Math.max(0,ih*(s.v/max)),r=Math.min(8,h,bw/2),x0=cx-bw/2,yb=pt+ih,yt=yb-h;
    const path=h>0?`M${x0},${yb}V${yt+r}Q${x0},${yt} ${x0+r},${yt}H${x0+bw-r}Q${x0+bw},${yt} ${x0+bw},${yt+r}V${yb}Z`:'';
    svg+=`<g class="slot" data-i="${i}"><rect class="hl" x="${pl+slotW*i+2}" y="${pt}" width="${slotW-4}" height="${ih}" rx="10"/>
      ${path?`<path class="barm growY" style="--i:${i}" d="${path}" fill="${color}" opacity="${s.cur||S.weekday?1:.5}"/>`:''}
      ${s.cur&&s.v?`<text class="vl" x="${cx}" y="${yt-8}" text-anchor="middle">${s.v}</text>`:''}
      ${showLabel(i)?`<text class="xl ${s.cur?'cur':''}" x="${Math.min(W-pr-labelW/2+5,Math.max(pl+labelW/2-5,cx))}" y="${H-8}" text-anchor="middle" opacity="${s.future?.45:1}">${esc(s.label)}</text>`:''}
      <rect class="hit" x="${pl+slotW*i}" y="0" width="${slotW}" height="${H}"/></g>`;
  });
  if(S.weekday){
    const pts=sl.map((s,i)=>[pl+slotW*i+slotW/2,y(s.avg)]);
    let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
    svg+=`<polyline class="avg-line" style="--len:${Math.ceil(len)}" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round" pointer-events="none"/>
      ${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="var(--text)" stroke="var(--card)" stroke-width="2" pointer-events="none"/>`).join('')}`;
  }
  svg+='</svg>';
  const tip=$('progTip');box.innerHTML=svg;box.appendChild(tip);
  $('progLegend').innerHTML=`<span><i class="sw-bar" style="--c:${color}"></i>${S.weekday?'Esta semana':M[2]}</span>`+
    (S.weekday?`<span><i class="sw-line"></i>Promedio de las ${AVG_WEEKS} semanas anteriores</span>`:`<span>El periodo actual va resaltado</span>`);
  box.querySelectorAll('.slot').forEach(g=>{
    const s=sl[+g.dataset.i];
    g.addEventListener('pointerenter',()=>{
      tip.innerHTML=`<b>${esc(s.tip)}</b><br>${s.v} ${M[1]}${S.weekday?`<br>Promedio anterior: ${Math.round(s.avg*10)/10}`:''}`;
      const r=g.querySelector('.hit').getBBox(),k=box.clientWidth/W;
      tip.style.left=Math.min(box.clientWidth-80,Math.max(80,(r.x+r.width/2)*k))+'px';
      tip.style.top=(Math.min(y(s.v),s.avg!==undefined?y(s.avg):H)*k-10)+'px';
      tip.classList.add('show');
    });
    g.addEventListener('pointerleave',()=>tip.classList.remove('show'));
  });
}
let progRz;addEventListener('resize',()=>{clearTimeout(progRz);progRz=setTimeout(renderProgress,150)});

// ───── calendario (Mes / Semana / Día, estilo Google Calendar) ─────
let calView='semana',calDate=new Date(T),calScroll=null;
const PX=56; // alto de una hora en las vistas Semana y Día
function calCitas(){return DATA.citas.filter(c=>!c.hecha&&lead(c.leadId))}
function renderCal(){
  if(!$('cal'))return;
  document.querySelectorAll('[data-act=cal-view]').forEach(b=>b.classList.toggle('on',b.dataset.v===calView));
  if(calView==='mes'){renderMonth();return}
  const days=calView==='dia'?[new Date(calDate)]:Array.from({length:7},(_,i)=>addDays(mondayOf(calDate),i));
  const a=days[0],b=days[days.length-1];
  $('calTitle').textContent=calView==='dia'?cap(a.toLocaleDateString(LOCALE,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))
    :(a.getMonth()===b.getMonth()?`${a.getDate()} – ${b.getDate()} de ${a.toLocaleDateString(LOCALE,{month:'long',year:'numeric'})}`
      :`${fmt(a)} – ${fmt(b)} ${b.getFullYear()}`);
  $('calHint').textContent='Toca una hora libre para agendar una cita en ese momento · toca una cita para abrir la ficha del cliente.';
  renderTimeGrid(days);
}
function renderMonth(){
  const base=new Date(calDate.getFullYear(),calDate.getMonth(),1),m=base.getMonth();
  $('calTitle').textContent=cap(base.toLocaleDateString(LOCALE,{month:'long',year:'numeric'}));
  $('calHint').textContent='Toca un día para agendar una cita · toca el número del día para ver su agenda por horas.';
  const start=mondayOf(base),cs=calCitas();
  let h='<div class="month">'+DOW.map(x=>`<div class="dow">${x}</div>`).join('');
  for(let i=0;i<42;i++){const day=addDays(start,i),ds=iso(day);
    const evs=cs.filter(c=>c.fecha===ds).sort((a,b)=>a.hora.localeCompare(b.hora));
    h+=`<div class="day ${day.getMonth()!==m?'out':''} ${ds===iso(T)?'today':''}" data-act="cita-new" data-fecha="${ds}">
      <button class="n" data-act="cal-day" data-fecha="${ds}" title="Ver el día">${day.getDate()}</button>
      ${evs.slice(0,3).map(c=>`<div class="ev" style="--c:var(${STATUS[citaStatus(c)][1]})" data-act="lead" data-id="${esc(c.leadId)}" title="${esc(c.tipo)}">${esc(c.hora)} ${esc(lead(c.leadId).nombre)}</div>`).join('')}
      ${evs.length>3?`<span class="ev-more">+${evs.length-3} más</span>`:''}</div>`}
  $('cal').innerHTML=h+'</div>';
}
/** Coloca citas que se solapan una al lado de la otra (carriles), como en Google Calendar. */
function layoutLanes(evs){
  evs.sort((a,b)=>a.s-b.s||b.e-a.e);
  let cluster=[],end=-1;
  const flush=()=>{const lanes=[];cluster.forEach(ev=>{let i=lanes.findIndex(e=>e<=ev.s);if(i<0){i=lanes.length;lanes.push(0)}lanes[i]=ev.e;ev.lane=i});
    cluster.forEach(ev=>ev.lanes=lanes.length);cluster=[]};
  evs.forEach(ev=>{if(cluster.length&&ev.s>=end)flush();cluster.push(ev);end=Math.max(end,ev.e)});
  if(cluster.length)flush();
  return evs;
}
function renderTimeGrid(days){
  const cs=calCitas(),dsSet=new Set(days.map(iso)),inRange=cs.filter(c=>dsSet.has(c.fecha));
  // Rango de horas: 7–21 por defecto, ampliado si hay citas fuera de él
  let h0=7,h1=21;inRange.forEach(c=>{const m=toMin(c.hora);if(m!==null){h0=Math.min(h0,Math.floor(m/60));h1=Math.max(h1,Math.ceil((m+(+c.duracion||30))/60))}});
  h1=Math.min(24,h1);const rows=h1-h0,now=new Date(),nowMin=now.getHours()*60+now.getMinutes();
  const prevBody=document.querySelector('.tg-body');if(prevBody)calScroll=prevBody.scrollTop;
  let h=`<div class="tg-wrap"><div class="tg ${days.length>1?'week':''}" style="--cols:${days.length};--px:${PX}px;--rows:${rows}">
    <div class="tg-head"><div></div>${days.map(d=>`<button class="tg-dh ${iso(d)===iso(T)?'today':''}" data-act="cal-day" data-fecha="${iso(d)}"><span>${d.toLocaleDateString(LOCALE,{weekday:'short'}).replace('.','')}</span><b>${d.getDate()}</b></button>`).join('')}</div>
    <div class="tg-allday"><div>sin hora</div>${days.map(d=>`<div>${inRange.filter(c=>c.fecha===iso(d)&&toMin(c.hora)===null).map(c=>
      `<div class="ev" style="--c:var(${STATUS[citaStatus(c)][1]})" data-act="lead" data-id="${esc(c.leadId)}">${esc(lead(c.leadId).nombre)}</div>`).join('')}</div>`).join('')}</div>
    <div class="tg-body"><div class="tg-grid"><div class="tg-hours">${Array.from({length:rows},(_,i)=>`<div><span>${String(h0+i).padStart(2,'0')}:00</span></div>`).join('')}</div>`;
  days.forEach(d=>{
    const ds=iso(d),evs=layoutLanes(inRange.filter(c=>c.fecha===ds&&toMin(c.hora)!==null).map(c=>{const s=toMin(c.hora);return {c,s,e:s+(+c.duracion||30)}}));
    h+=`<div class="tg-col ${ds===iso(T)?'today':''}" data-fecha="${ds}" data-h0="${h0}"><div class="tg-ghost"></div>
      ${evs.map(({c,s,e,lane,lanes})=>{const l=lead(c.leadId),top=(s-h0*60)/60*PX,ht=Math.max(24,(e-s)/60*PX-3);return `
        <div class="tg-ev" style="--c:var(${STATUS[citaStatus(c)][1]});--l:${lane};--n:${lanes};top:${top}px;height:${ht}px" data-act="lead" data-id="${esc(l.id)}" title="${esc(c.tipo)} · ${esc(l.nombre)}">
          <b>${esc(l.nombre)}</b><span>${esc(c.hora)}–${hm(e)} · ${esc(c.tipo)}</span></div>`}).join('')}
      ${ds===iso(now)&&nowMin>=h0*60&&nowMin<=h1*60?`<div class="tg-now" style="top:${(nowMin-h0*60)/60*PX}px"></div>`:''}</div>`;
  });
  $('cal').innerHTML=h+'</div></div></div></div>';
  const body=document.querySelector('.tg-body');
  body.scrollTop=calScroll!==null?calScroll:Math.max(0,(Math.max(8,days.some(d=>iso(d)===iso(T))?Math.floor(nowMin/60)-1:8)-h0)*PX);
}
/** Minuto (redondeado a 30) bajo el puntero dentro de una columna de día. */
function slotAt(col,clientY){const r=col.getBoundingClientRect(),m=+col.dataset.h0*60+Math.floor((clientY-r.top)/PX*2)*30;return Math.max(0,Math.min(23*60+30,m))}
$('cal').addEventListener('click',e=>{
  const col=e.target.closest('.tg-col');if(!col||e.target.closest('.tg-ev'))return;
  openCita(null,col.dataset.fecha,hm(slotAt(col,e.clientY)));
});
$('cal').addEventListener('pointermove',e=>{
  const col=e.target.closest('.tg-col');document.querySelectorAll('.tg-ghost').forEach(g=>{if(!col||g.parentNode!==col)g.style.display='none'});
  if(!col||e.target.closest('.tg-ev'))return;
  const m=slotAt(col,e.clientY),g=col.querySelector('.tg-ghost');
  g.style.display='block';g.style.top=((m-col.dataset.h0*60)/60*PX)+'px';g.style.height=(PX/2-2)+'px';g.textContent='+ '+hm(m);
});
$('cal').addEventListener('pointerleave',()=>document.querySelectorAll('.tg-ghost').forEach(g=>g.style.display='none'));

// ───── ficha del lead ─────
function openLead(id,preset){
  fichaId=id||null;
  const base=id?lead(id):{nombre:'',telefono:'',email:'',uso:'',etapa:'Nuevo',capacidad:'',espacio:'',cuando:'',precio:'',origen:'Meta Ads',fechaIngreso:iso(T),motivoPerdida:''};
  if(!base)return;
  const l=Object.assign({},base,preset||{});
  nuevoUso=l.uso;nuevaTemp=l.temperatura||'';
  const lista=id?citasDe(id):[];
  const hist=id?DATA.historial.filter(h=>h.leadId===id).reverse():[];
  // Línea de tiempo: fecha de entrada en cada etapa (las 6 del camino + Perdido si aplica)
  const path=STAGES.slice(0,6),si=STAGES.indexOf(base.etapa),lost=base.etapa==='Perdido';
  const tl=path.map((s,i)=>{const d=stageDate(base,s),done=!!d||i<si;
    return `<div class="tl ${s===base.etapa?'cur':done?'done':''}" style="${stStyle(s)}"><i></i><b>${s}</b><small>${d?fmt(pd(d))+(String(d).length>10?' · '+String(d).slice(11,16):''):'—'}</small></div>`}).join('')
    +(lost?`<div class="tl cur lost" style="--sc:var(--vencido)"><i></i><b>Perdido</b><small>${base.fechaPerdido?fmt(pd(base.fechaPerdido)):'—'}${base.motivoPerdida?' · '+esc(base.motivoPerdida):''}</small></div>`:'');
  const enEtapa=pd(stageDate(base,base.etapa)),dias=enEtapa?Math.round((T-enEtapa)/864e5):null;
  const [motSel,motTxt]=(()=>{const m=l.motivoPerdida||'';const s=MOTIVOS.find(x=>m===x||m.startsWith(x+' — '));return s?[s,m.slice(s.length+3)]:[m?'Otro':'',m]})();
  $('ficha').innerHTML=`
   <div class="fhead" style="${stStyle(base.etapa)}"><div class="avatar">${id?esc(ini(l.nombre)):'+'}</div>
     <div><h2>${id?esc(l.nombre):'Nuevo lead'} <span id="fTempTag">${tempTag(l.temperatura)}</span></h2><p>${id?`Ingresó el ${fmt(pd(l.fechaIngreso))} · ${esc(l.origen)} · ${esc(base.etapa)}${dias!==null?` desde hace ${dias===0?'hoy':dias+' días'}`:''}`:'Rellena los datos y guarda'}</p></div>
     <div class="acts">${pagoTag(base)}${id&&base.etapa==='Facturado'?`<button class="btn sm ghost" data-act="recibo" data-id="${esc(id)}">🧾 Recibo</button>`:''}${id&&!cerrado(base)?`<button class="btn sm win" data-act="lead-won">🧾 Facturado</button><button class="btn sm lose" data-act="lead-lost">✕ Perdido</button>`:''}
       <button class="icon-btn" data-act="close-lead" aria-label="Cerrar" style="background:var(--card-2)">✕</button></div></div>
   ${id?`<div class="timeline" style="--n:${path.length+(lost?1:0)}">${tl}</div>`:''}
   <div class="fgrid">
    <div class="sec"><h4>Contacto</h4>
      <div class="field"><label for="fNombre">Nombre *</label><input id="fNombre" value="${esc(l.nombre)}" maxlength="120"></div>
      <div class="row2"><div class="field"><label for="fTel">Teléfono</label><input id="fTel" type="tel" value="${esc(l.telefono)}" maxlength="40"></div>
      <div class="field"><label for="fOrigen">Origen</label><select id="fOrigen">${ORIGENES.map(o=>`<option ${o===l.origen?'selected':''}>${o}</option>`).join('')}</select></div></div>
      <div class="field"><label for="fEmail">Email</label><input id="fEmail" type="email" value="${esc(l.email)}" maxlength="120"></div>
      <div class="field"><label>Uso</label><div class="seg">${USOS.map(u=>`<button type="button" class="${l.uso===u?'on':''}" data-act="uso" data-v="${u}">${usoIcon[u]} ${u}</button>`).join('')}</div></div>
      <div class="field" style="margin-bottom:0"><label>Temperatura <span class="muted-s" style="font-weight:500">· ¿qué tan cerca está de comprar?</span></label>
        <div class="temp-seg">${Object.entries(TEMPS).map(([t,[c,d]])=>`<button type="button" class="${l.temperatura===t?'on':''}" style="--tc:var(${c})" data-act="temp" data-v="${t}" title="${d}">${t}</button>`).join('')}</div></div>
    </div>
    <div class="sec"><h4>Cualificación</h4>
      <div class="field"><label for="fCap">Capacidad</label><input id="fCap" value="${esc(l.capacidad)}" placeholder="Ej. 300 m³" maxlength="300"></div>
      <div class="field"><label for="fEsp">Espacio</label><input id="fEsp" value="${esc(l.espacio)}" placeholder="¿Tiene espacio? ¿Medidas?" maxlength="300"></div>
      <div class="field"><label for="fCuando">Cuándo</label><input id="fCuando" value="${esc(l.cuando)}" placeholder="¿Para cuándo lo necesita?" maxlength="300"></div>
      <div class="field"><label for="fPrecio">Precio</label><input id="fPrecio" value="${esc(l.precio)}" placeholder="Presupuesto / precio dado" maxlength="300"></div>
    </div>
    <div class="sec"><h4>Etapa y citas</h4>
      <div class="field"><label for="fEtapa">Etapa</label><select id="fEtapa">${STAGES.map(s=>`<option ${s===l.etapa?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field" id="payBox" ${l.etapa==='Facturado'?'':'hidden'}><label for="fPago">Estado de pago</label>
        <select id="fPago">${Object.keys(PAGOS).map(p=>`<option ${p===(l.estadoPago||'Pendiente de pago')?'selected':''}>${p}</option>`).join('')}</select>
        ${l.estadoPago==='Pagado'&&l.fechaPagado?`<small class="muted-s">Cobrado el ${fmt(pd(l.fechaPagado))} · ${esc(String(l.fechaPagado).slice(11,16))}</small>`:''}</div>
      <div class="lost-box" id="lostBox" ${l.etapa==='Perdido'?'':'hidden'}>
        <div class="field"><label for="fMotivo">¿Por qué no se ganó?</label><select id="fMotivo"><option value="">Elige un motivo…</option>${MOTIVOS.map(m=>`<option ${m===motSel?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="field" style="margin:0"><label for="fMotivoTxt">Detalle (opcional)</label><input id="fMotivoTxt" maxlength="200" value="${esc(motTxt)}" placeholder="Ej. le pareció caro frente a la competencia"></div>
      </div>
      <div class="citas">${!id?'<p class="muted-s">Guarda el lead para poder agendarle citas.</p>':
        lista.map(c=>`<div class="cita-item" style="--c:var(${STATUS[citaStatus(c)][1]})">
          <div><b>${fmt(pd(c.fecha))}${c.hora?' · '+esc(c.hora):''}</b><span>${esc(c.tipo)} · ${esc(c.duracion||30)} min${c.nota?' — '+esc(c.nota):''}</span></div>
          <div class="acts"><button class="mini" data-act="cita-done" data-id="${esc(c.id)}" title="Marcar como realizada">✓ Hecha</button>
          <button class="mini" data-act="cita-del" data-id="${esc(c.id)}" title="Cancelar cita">✕</button></div></div>`).join('')
        ||'<p class="muted-s">Sin citas agendadas · el lead está “Por trabajar”.</p>'}</div>
      ${id?`<button class="btn ghost full" data-act="cita-new" data-lead="${esc(id)}" style="margin-top:12px">+ Agendar cita</button>`:''}
    </div>
    <div class="sec"><h4>${id?'Historial y notas':'Notas / comentarios'}</h4>
      <div class="field"><label for="fNota">${id?'Nueva nota':'Notas o comentarios (opcional)'}</label>
        <textarea id="fNota" rows="${id?2:4}" maxlength="2000" placeholder="${id?'Añadir nota de la llamada…':'Ej. Vio el anuncio en Facebook, quiere un depósito para la granja…'}"></textarea></div>
      ${id?`<button class="btn ghost sm" data-act="nota-add">Añadir nota</button>
      <div class="hist">${hist.map(h=>`<div><small>${esc(h.fecha)}</small>${esc(h.texto)}</div>`).join('')||'<p class="muted-s">Sin actividad todavía.</p>'}</div>`
      :'<p class="muted-s">Se guardará en el historial del lead al crearlo.</p>'}
    </div>
    <div class="sec full"><h4>Datos de facturación</h4>
      ${base.factNumero?`<div class="recibo-info"><span>🧾 Recibo ${esc(base.factNumero)} · emitido el ${fdate(base.factFecha)}</span>
        <button class="btn sm ghost" data-act="recibo" data-id="${esc(id)}">Ver recibo</button></div>`
        :'<p class="muted-s" style="margin-bottom:12px">Puedes ir completándolos en cualquier momento. El nº de recibo se asigna al pasar a Facturado.</p>'}
      <div class="fact-grid">
        <div class="field span2"><label for="fFNombre">Nombre o razón social</label><input id="fFNombre" value="${esc(l.factNombre)}" maxlength="150" placeholder="${esc(l.nombre||'Como figura en la factura')}"></div>
        <div class="field"><label for="fFNif">${docName()}</label><input id="fFNif" value="${esc(l.factNif)}" maxlength="20" autocapitalize="characters"></div>
        <div class="field span2"><label for="fFDir">Dirección</label><input id="fFDir" value="${esc(l.factDireccion)}" maxlength="200"></div>
        <div class="field"><label for="fFCP">Código postal</label><input id="fFCP" value="${esc(l.factCP)}" maxlength="10" inputmode="numeric"></div>
        <div class="field"><label for="fFPob">Población</label><input id="fFPob" value="${esc(l.factPoblacion)}" maxlength="80"></div>
        <div class="field"><label for="fFProv">Provincia</label><input id="fFProv" value="${esc(l.factProvincia)}" maxlength="80"></div>
        <div class="field"><label for="fFEmail">Email de facturación</label><input id="fFEmail" type="email" value="${esc(l.factEmail)}" maxlength="120" placeholder="${esc(l.email||'')}"></div>
        <div class="field span3"><label for="fFConcepto">Concepto</label><input id="fFConcepto" value="${esc(l.factConcepto)}" maxlength="300" placeholder="Ej. Depósito de ${esc((l.uso||'agua').toLowerCase())} de ${esc(l.capacidad||'300 m³')}, instalación incluida"></div>
        <div class="field"><label for="fFImporte">Importe sin ${taxName()}</label><input id="fFImporte" value="${esc(l.factImporte?toNum(l.factImporte).toLocaleString(NUM_LOCALE,{minimumFractionDigits:2}):'')}" inputmode="decimal" maxlength="20" placeholder="${(0).toLocaleString(NUM_LOCALE,{minimumFractionDigits:2})}"></div>
        <div class="field"><label for="fFIva">${taxName()} (%)</label><input id="fFIva" value="${esc(l.factIva?toNum(l.factIva).toLocaleString(NUM_LOCALE):'')}" inputmode="decimal" maxlength="6" placeholder="${esc(toNum((DATA.config||{}).ivaDefecto||21).toLocaleString(NUM_LOCALE))}"></div>
        <div class="field"><label for="fFForma">Forma de pago</label><select id="fFForma"><option value="">—</option>${FORMAS_PAGO.map(f=>`<option ${f===l.factFormaPago?'selected':''}>${f}</option>`).join('')}</select></div>
      </div>
      <div class="fact-total"><span id="fFDesglose"></span><b id="fFTotal"></b></div>
    </div>
   </div>
   ${id?`<div class="danger-zone"><span>Eliminar el lead borra también sus citas, notas y movimientos. No se puede deshacer.</span>
     <button class="btn danger sm" data-act="lead-del">Eliminar lead</button></div>`:''}
   <div class="factions"><button class="btn ghost" data-act="close-lead">Cerrar</button><button class="btn" data-act="lead-save" id="saveBtn">${id?'Guardar cambios':'Crear lead'}</button></div>`;
  // Total en vivo mientras se escribe el importe o el IVA
  const recalc=()=>{const t=totales({factImporte:$('fFImporte').value,factIva:$('fFIva').value.trim()});
    $('fFDesglose').textContent=t.hayImporte?`Base ${eur(t.base)} + ${taxName()} ${t.iva.toLocaleString(NUM_LOCALE)}% (${eur(t.cuota)})`:'Escribe el importe para calcular el total';
    $('fFTotal').textContent=t.hayImporte?eur(t.total):'—'};
  ['fFImporte','fFIva'].forEach(i=>$(i).addEventListener('input',recalc));recalc();
  $('fEtapa').addEventListener('change',()=>{const v=$('fEtapa').value;
    $('lostBox').hidden=v!=='Perdido';$('payBox').hidden=v!=='Facturado';if(!$('lostBox').hidden)$('fMotivo').focus()});
  showOv('ovLead');
  if(!id)setTimeout(()=>$('fNombre').focus(),50);
  if(preset&&preset.etapa==='Perdido')setTimeout(()=>$('fMotivo').focus(),80);
}
function closeLead(){fichaId=null;hideOv('ovLead')}
function refreshFicha(){if(fichaId&&$('ovLead').classList.contains('open'))openLead(fichaId)}
async function saveLead(btn){
  const v=id=>$(id).value.trim();
  const mot=v('fMotivo'),motTxt=v('fMotivoTxt');
  const data={id:fichaId,nombre:v('fNombre'),telefono:v('fTel'),email:v('fEmail'),uso:nuevoUso,etapa:$('fEtapa').value,
    capacidad:v('fCap'),espacio:v('fEsp'),cuando:v('fCuando'),precio:v('fPrecio'),origen:$('fOrigen').value,
    motivoPerdida:mot?(motTxt?mot+' — '+motTxt:mot):motTxt,temperatura:nuevaTemp,
    estadoPago:$('fEtapa').value==='Facturado'?$('fPago').value:'',
    factNombre:v('fFNombre'),factNif:v('fFNif'),factEmail:v('fFEmail'),factDireccion:v('fFDir'),factCP:v('fFCP'),
    factPoblacion:v('fFPob'),factProvincia:v('fFProv'),factConcepto:v('fFConcepto'),factImporte:v('fFImporte'),factIva:v('fFIva'),factFormaPago:$('fFForma').value,
    nota:v('fNota')}; // la nota escrita y no añadida aún también se guarda (no se pierde nada)
  if(!data.nombre){toast('El nombre es obligatorio',true);$('fNombre').focus();return}
  if(data.etapa==='Perdido'&&!data.motivoPerdida){toast('Indica por qué no se ganó el lead',true);$('fMotivo').focus();return}
  btn.setAttribute('aria-busy','true');
  try{const r=await api('saveLead',data);setData(r.data,r.id);openLead(r.id);
    toast(!data.id?'Lead creado · ya puedes agendarle una cita':data.etapa==='Facturado'&&lead(r.id)?'Lead facturado 🧾 · aparece en Facturación':'Cambios guardados')}
  catch(e){btn.removeAttribute('aria-busy')}
}

// ───── recibo (ver, compartir por email / WhatsApp, copiar, imprimir) ─────
let reciboId=null;
function openRecibo(id){
  const l=lead(id);if(!l)return;
  if(l.etapa!=='Facturado'){openLead(id);return}
  reciboId=id;
  const cfg=DATA.config||{},t=totales(l),pag=l.estadoPago==='Pagado';
  const loc=[l.factCP,l.factPoblacion].filter(Boolean).join(' ')+(l.factProvincia&&l.factProvincia!==l.factPoblacion?` (${l.factProvincia})`:'');
  const dirCli=[l.factDireccion,loc.trim()].filter(Boolean).join(', ');
  const emailCli=l.factEmail||l.email,texto=reciboTexto(l),asunto=(s=>LANG==='en'&&window.YK_tr?YK_tr(s):s)(`Recibo ${l.factNumero||''}${cfg.empresaNombre?' · '+cfg.empresaNombre:''}`);
  const mail=`mailto:${encodeURIComponent(emailCli||'')}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
  const tel=waPhone(l.telefono),wa=`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
  const falta=[!t.hayImporte&&'el importe',!cfg.empresaNombre&&'los datos de tu empresa (pestaña Facturación)'].filter(Boolean);
  $('reciboBox').innerHTML=`
    ${falta.length?`<div class="rc-warn no-print">⚠ Falta ${falta.join(' y ')} para que el recibo esté completo.</div>`:''}
    <div class="recibo" id="recibo">
      <div class="rc-head">
        <div class="rc-emisor">${ICON.logo}<div><b>${esc(cfg.empresaNombre||'Tu empresa')}</b>
          <small>${[cfg.empresaNif&&docName()+' '+esc(cfg.empresaNif),esc(cfg.empresaDireccion||''),esc(cfg.empresaTelefono||''),esc(cfg.empresaEmail||'')].filter(Boolean).join(' · ')}</small></div></div>
        <div class="rc-num"><span>RECIBO</span><b>${esc(l.factNumero||'—')}</b><small>Fecha ${fdate(l.factFecha||l.fechaFacturado)}</small></div>
      </div>
      <div class="rc-stamp ${pag?'ok':'pend'}">${pag?'✓ Pagado el '+fdate(l.fechaPagado):'Pendiente de pago'}</div>
      <div class="rc-grid">
        <div><h5>Cliente</h5><b>${esc(l.factNombre||l.nombre)}</b>
          <small>${[l.factNif&&docName()+' '+esc(l.factNif),esc(dirCli),esc(emailCli||''),esc(l.telefono||'')].filter(Boolean).join('<br>')}</small></div>
        <div><h5>Forma de pago</h5><b>${esc(l.factFormaPago||'—')}</b></div>
      </div>
      <table class="rc-lines"><thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
        <tbody><tr><td>${esc(l.factConcepto||('Depósito'+(l.uso?' para '+l.uso.toLowerCase():'')+(l.capacidad?' · '+l.capacidad:'')))}</td><td>${eur(t.base)}</td></tr></tbody></table>
      <div class="rc-tot"><div><span>Base imponible</span><b>${eur(t.base)}</b></div><div><span>${taxName()} ${t.iva.toLocaleString(NUM_LOCALE)}%</span><b>${eur(t.cuota)}</b></div>
        <div class="t"><span>Total</span><b>${eur(t.total)}</b></div></div>
      ${cfg.pieRecibo?`<p class="rc-pie">${esc(cfg.pieRecibo)}</p>`:''}
    </div>
    <div class="rc-actions no-print">
      <a class="btn mail" href="${esc(mail)}" target="_blank" rel="noopener" title="${emailCli?'Enviar a '+esc(emailCli):'Elige el destinatario en tu app de correo'}">✉ Email</a>
      <a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener" title="${tel?'Enviar a +'+esc(tel):'Elige el contacto en WhatsApp'}">WhatsApp</a>
      <button class="btn ghost" data-act="recibo-copy">Copiar texto</button>
      <button class="btn ghost" data-act="recibo-print">Imprimir / PDF</button>
      <button class="btn ghost" data-act="recibo-edit">Editar ficha</button>
      <button class="btn ghost" data-act="close-recibo">Cerrar</button>
    </div>`;
  showOv('ovRecibo');$('reciboBox').scrollTop=0;
}
function closeRecibo(){reciboId=null;hideOv('ovRecibo')}
async function copyText(txt){
  try{await navigator.clipboard.writeText(txt);return true}catch(e){}
  // Respaldo para navegadores que no permiten el portapapeles
  const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();
  let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok;
}

// ───── citas ─────
function openCita(leadId,fecha,hora){
  const fijo=leadId&&lead(leadId);
  const abiertos=DATA.leads.filter(l=>!cerrado(l)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(!fijo&&!abiertos.length){toast('Primero crea un lead',true);return}
  $('citaBox').innerHTML=`
    <div class="fhead"><div class="avatar" style="background:var(--st-1)">📅</div><div><h2>Nueva cita</h2><p>${fijo?'Para '+esc(fijo.nombre):'Elige el lead, el día y la hora'}</p></div>
      <div class="acts"><button class="icon-btn" data-act="close-cita" aria-label="Cerrar" style="background:var(--card-2)">✕</button></div></div>
    <div class="field"><label>Lead</label>
      ${fijo?`<input value="${esc(fijo.nombre)} · ${esc(fijo.telefono)}" disabled><input type="hidden" id="cLead" value="${esc(fijo.id)}">`
        :`<input id="cBuscar" placeholder="Buscar por nombre o teléfono…" autocomplete="off">
          <select id="cLead" size="5" class="lead-pick">${abiertos.map((l,i)=>`<option value="${esc(l.id)}" ${i===0?'selected':''}>${esc(l.nombre)} · ${esc(l.telefono)} · ${esc(l.etapa)}</option>`).join('')}</select>`}
    </div>
    <div class="row2">
      <div class="field"><label for="cFecha">Fecha</label><input type="date" id="cFecha" value="${esc(fecha||iso(T))}"></div>
      <div class="field"><label for="cHora">Hora</label><input type="time" id="cHora" value="${esc(hora||'10:00')}" step="300"></div>
      <div class="field"><label for="cDur">Duración</label><select id="cDur">${DURACIONES.map(([v,t])=>`<option value="${v}" ${v==='30'?'selected':''}>${t}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label for="cTipo">Tipo</label><select id="cTipo">${TIPOS.map(t=>`<option>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="cNota">Nota (opcional)</label><textarea id="cNota" rows="2" maxlength="500" placeholder="Ej. confirmar medidas del espacio"></textarea></div>
    <div class="factions"><button class="btn ghost" data-act="close-cita">Cancelar</button><button class="btn" data-act="cita-save">Guardar cita</button></div>`;
  showOv('ovCita');
  const b=$('cBuscar');
  if(b){b.addEventListener('input',()=>{const s=b.value.toLowerCase();let first=null;
    [...$('cLead').options].forEach(o=>{o.hidden=!o.textContent.toLowerCase().includes(s);if(!o.hidden&&!first)first=o});
    if(first&&$('cLead').selectedOptions[0]?.hidden)first.selected=true;});setTimeout(()=>b.focus(),60)}
}
function closeCita(){hideOv('ovCita')}
async function saveCita(btn){
  const sel=$('cLead'),opt=sel.tagName==='SELECT'?sel.selectedOptions[0]:null;
  const data={leadId:opt?(opt.hidden?'':opt.value):sel.value,fecha:$('cFecha').value,hora:$('cHora').value,duracion:$('cDur').value,tipo:$('cTipo').value,nota:$('cNota').value.trim()};
  if(!data.leadId){toast('Elige un lead',true);return}
  if(!data.fecha){toast('Elige una fecha',true);return}
  btn.setAttribute('aria-busy','true');
  try{setData(await api('addCita',data),data.leadId);closeCita();refreshFicha();toast('Cita agendada con '+lead(data.leadId).nombre)}
  catch(e){btn.removeAttribute('aria-busy')}
}

// ───── acciones (delegación de clics) ─────
const ACTIONS={
  nav(el){
    document.querySelectorAll('.nav[data-view]').forEach(x=>x.classList.toggle('active',x===el));
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='v-'+el.dataset.view));
    const v=el.dataset.view;
    if(isMobile())setNav(false);
    if(v==='dashboard')renderProgress();
    if(v==='calendario')renderCal();
    if(v==='usuarios'||v==='registro')loadAdmin().then(()=>enter(...VIEW_PARTS[v])).catch(()=>{});
    else enter(...VIEW_PARTS[v]);
  },
  'nav-cal'(){calView='dia';calDate=new Date(T);ACTIONS.nav(document.querySelector('.nav[data-view=calendario]'))},
  filtro(el){
    filtro=el.dataset.f;renderFilters();renderTable();
    if(el.classList.contains('kpi')||el.classList.contains('big'))$('filters').scrollIntoView({behavior:'smooth',block:'center'});
  },
  lead(el){openLead(el.dataset.id)},
  recibo(el){const id=el.dataset.id;if($('ovLead').classList.contains('open'))closeLead();openRecibo(id)},
  'close-recibo'(){closeRecibo()},
  'recibo-edit'(){const id=reciboId;closeRecibo();openLead(id)},
  async 'recibo-copy'(){const l=lead(reciboId);if(!l)return;toast(await copyText(reciboTexto(l))?'Recibo copiado: pégalo donde quieras':'No se pudo copiar automáticamente',!1)},
  'recibo-print'(){document.body.classList.add('print-recibo');window.print();setTimeout(()=>document.body.classList.remove('print-recibo'),500)},
  'lead-new'(){openLead(null)},
  'lead-save'(el){saveLead(el)},
  'close-lead'(){closeLead()},
  'lead-won'(){if(!confirm('¿Marcar este lead como FACTURADO?\n\nQuedará como “Pendiente de pago” en la pestaña Facturación.'))return;
    $('fEtapa').value='Facturado';$('lostBox').hidden=true;$('fPago').value='Pendiente de pago';saveLead($('saveBtn'))},
  'lead-lost'(){$('fEtapa').value='Perdido';$('lostBox').hidden=false;$('fMotivo').focus();toast('Elige el motivo y pulsa “Guardar cambios”')},
  async 'lead-del'(el){
    const l=lead(fichaId);if(!l)return;
    if(!confirm(`¿Eliminar a "${l.nombre}"?\n\nSe borrarán también sus citas, notas y movimientos. Esta acción no se puede deshacer.`))return;
    el.setAttribute('aria-busy','true');
    try{const nombre=l.nombre;setData(await api('deleteLead',l.id));closeLead();toast(nombre+' eliminado')}
    finally{el.removeAttribute('aria-busy')}
  },
  uso(el){nuevoUso=nuevoUso===el.dataset.v?'':el.dataset.v;el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===nuevoUso))},
  // Temperatura: clic para elegir, clic otra vez para quitarla. Se guarda con "Guardar cambios".
  temp(el){nuevaTemp=nuevaTemp===el.dataset.v?'':el.dataset.v;el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===nuevaTemp));$('fTempTag').innerHTML=tempTag(nuevaTemp)},
  tfiltro(el){tfiltro=tfiltro===el.dataset.f?'':el.dataset.f;renderFilters();renderTable()},
  'cita-new'(el){openCita(el.dataset.lead,el.dataset.fecha)},
  'cita-save'(el){saveCita(el)},
  'close-cita'(){closeCita()},
  async 'cita-done'(el){el.setAttribute('aria-busy','true');
    try{setData(await api('setCitaHecha',el.dataset.id),fichaId);refreshFicha();toast('Cita marcada como realizada')}finally{el.removeAttribute('aria-busy')}},
  async 'cita-del'(el){if(!confirm('¿Cancelar esta cita?'))return;el.setAttribute('aria-busy','true');
    try{setData(await api('deleteCita',el.dataset.id),fichaId);refreshFicha();toast('Cita cancelada')}finally{el.removeAttribute('aria-busy')}},
  async 'nota-add'(el){const t=$('fNota').value.trim();if(!t){toast('Escribe la nota primero',true);$('fNota').focus();return}
    el.setAttribute('aria-busy','true');
    try{setData(await api('addNota',fichaId,t),fichaId);refreshFicha();toast('Nota añadida')}finally{el.removeAttribute('aria-busy')}},
  cal(el){const n=+el.dataset.n;
    if(n===0)calDate=new Date(T);
    else if(calView==='mes')calDate=new Date(calDate.getFullYear(),calDate.getMonth()+n,1);
    else calDate=addDays(calDate,n*(calView==='dia'?1:7));
    calScroll=null;renderCal();
    const c=$('cal');c.classList.remove('slide-l','slide-r');void c.offsetWidth;c.classList.add(n<0?'slide-r':'slide-l');
    clearTimeout(c._s);c._s=setTimeout(()=>c.classList.remove('slide-l','slide-r'),400)},
  'cal-view'(el){calView=el.dataset.v;calScroll=null;renderCal();enter('cal')},
  'cal-day'(el,e){e.stopPropagation();calView='dia';calDate=pd(el.dataset.fecha);calScroll=null;renderCal();enter('cal')},
  theme(){const t=document.documentElement.dataset.theme==='light'?'dark':'light';
    if(document.startViewTransition&&!REDUCED)document.startViewTransition(()=>applyTheme(t,true));else applyTheme(t,true)},
  logout(){lock('Has cerrado sesión.',true)},
  'prog-metric'(el){progMetric=el.dataset.v;segOn(el);renderProgress();enter('progChart')},
  'prog-period'(el){progPeriod=el.dataset.v;segOn(el);renderProgress();enter('progChart')},
  'audit-refresh'(el){el.setAttribute('aria-busy','true');loadAdmin().finally(()=>el.removeAttribute('aria-busy'))},
  async 'user-toggle'(el){
    const u=ADMIN&&ADMIN.usuarios.find(x=>x.uid===el.dataset.id);if(!u)return;
    const activar=u.activo!=='1';
    if(!activar&&!confirm(`¿Quitar el acceso a ${u.nombre}?\n\nNo podrá entrar al CRM hasta que lo reactives.`))return;
    el.setAttribute('aria-busy','true');
    try{setAdmin(await api('updateUser',u.uid,{activo:activar}));toast(activar?u.nombre+' reactivado':'Acceso retirado a '+u.nombre)}
    finally{el.removeAttribute('aria-busy')}
  },
  async 'user-role'(el){
    const u=ADMIN&&ADMIN.usuarios.find(x=>x.uid===el.dataset.id);if(!u)return;
    const rol=u.rol==='admin'?'usuario':'admin';
    if(!confirm(`¿Cambiar a ${u.nombre} a ${rol==='admin'?'Administrador':'Usuario'}?`))return;
    el.setAttribute('aria-busy','true');
    try{setAdmin(await api('updateUser',u.uid,{rol}));toast(u.nombre+' ahora es '+(rol==='admin'?'administrador':'usuario'))}
    finally{el.removeAttribute('aria-busy')}
  },
  async 'user-reset'(el){
    const u=ADMIN&&ADMIN.usuarios.find(x=>x.uid===el.dataset.id);if(!u)return;
    if(!confirm(`¿Enviar a ${u.email} un email para cambiar su contraseña?`))return;
    el.setAttribute('aria-busy','true');
    try{await api('sendPasswordReset',u.uid);toast('Email enviado a '+u.email);if($('v-registro').classList.contains('active'))loadAdmin()}
    finally{el.removeAttribute('aria-busy')}
  },
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const fn=ACTIONS[el.dataset.act];if(fn)Promise.resolve(fn(el,e)).catch(()=>{});
});
$('ovLead').addEventListener('click',e=>{if(e.target.id==='ovLead')closeLead()});
$('ovCita').addEventListener('click',e=>{if(e.target.id==='ovCita')closeCita()});
$('ovRecibo').addEventListener('click',e=>{if(e.target.id==='ovRecibo')closeRecibo()});
// Datos de la empresa (solo admin; el servidor lo vuelve a comprobar)
function fillConfig(){const cfg=DATA.config||{};document.querySelectorAll('#cfgForm [data-k]').forEach(i=>{if(document.activeElement!==i)i.value=cfg[i.dataset.k]||''})}
$('cfgForm').addEventListener('submit',async e=>{
  e.preventDefault();const data={};document.querySelectorAll('#cfgForm [data-k]').forEach(i=>data[i.dataset.k]=i.value.trim());
  $('cfgBtn').setAttribute('aria-busy','true');
  try{setData(await api('saveConfig',data));fillConfig();toast('Datos de la empresa guardados')}catch(err){}finally{$('cfgBtn').removeAttribute('aria-busy')}
});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if($('ovRecibo').classList.contains('open'))closeRecibo();else if($('ovCita').classList.contains('open'))closeCita();else if($('ovLead').classList.contains('open'))closeLead();else if(isMobile()&&navOpen())setNav(false)});
$('q').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();renderTable();renderKanban();renderPagos()});

// ───── administración (usuarios y registro) ─────
let ADMIN=null;
async function loadAdmin(){setAdmin(await api('adminData'))}
function setAdmin(a){ADMIN=a;renderUsers();renderAuditFilters();renderAudit()}
function renderUsers(){
  const us=(ADMIN&&ADMIN.usuarios||[]).slice().sort((a,b)=>(b.activo==='1')-(a.activo==='1')||(b.rol==='admin')-(a.rol==='admin')||a.nombre.localeCompare(b.nombre));
  const me=DATA.yo&&DATA.yo.email;
  $('usersCount').textContent=us.filter(u=>u.activo==='1').length+' activos de '+us.length;
  $('usersBody').innerHTML=us.map(u=>{const on=u.activo==='1',self=u.email===me;return `
    <tr style="--c:var(${on?'--aldia':'--cerrado'})">
      <td><b>${esc(u.nombre)}</b>${u.principal?' <span class="role-badge admin">Principal</span>':''}${self?' <span class="role-badge">Tú</span>':''}</td>
      <td>${esc(u.email)}</td>
      <td><span class="role-badge ${u.rol==='admin'?'admin':''}">${u.rol==='admin'?'Administrador':'Usuario'}</span></td>
      <td><span class="spill" style="--c:var(${!on?'--vencido':u.uid.startsWith('pendiente-')?'--porvencer':'--aldia'})"><i class="dot"></i>${!on?'Sin acceso':u.uid.startsWith('pendiente-')?'Pendiente de primer acceso':'Activo'}</span></td>
      <td>${esc(u.ultimoAcceso)||'—'}</td>
      <td>${u.principal||self?'<span class="muted-s">—</span>':`<div class="acts-row">
        <button class="mini" data-act="user-role" data-id="${esc(u.uid)}">${u.rol==='admin'?'Hacer usuario':'Hacer admin'}</button>
        <button class="mini" data-act="user-toggle" data-id="${esc(u.uid)}">${on?'Quitar acceso':'Reactivar'}</button>
        ${on?`<button class="mini" data-act="user-reset" data-id="${esc(u.uid)}" title="Enviar email para cambiar la contraseña">✉ Contraseña</button>`:''}</div>`}</td></tr>`}).join('');
}
function renderAuditFilters(){
  const a=ADMIN&&ADMIN.auditoria||[];
  const fill=(id,vals,label)=>{const sel=$(id),cur=sel.value;
    sel.innerHTML=`<option value="">${label}</option>`+[...new Set(vals)].sort().map(v=>`<option ${v===cur?'selected':''}>${esc(v)}</option>`).join('')};
  fill('aUser',a.map(x=>x.email),'Todos los usuarios');
  fill('aAccion',a.map(x=>x.accion),'Todas las acciones');
}
const ACC_COLOR={'Lead eliminado':'--vencido','Lead perdido':'--vencido','Cita cancelada':'--vencido','Usuario actualizado':'--porvencer','Usuario creado':'--porvencer',
  'Email de contraseña enviado':'--porvencer','Lead creado':'--aldia','Lead facturado':'--aldia','Pago registrado':'--aldia','Pago pendiente':'--porvencer','Cita realizada':'--aldia','Cita agendada':'--trabajar','Etapa cambiada':'--trabajar','Inicio de sesión':'--cerrado'};
function renderAudit(){
  const a=ADMIN&&ADMIN.auditoria||[],s=$('aQ').value.trim().toLowerCase(),u=$('aUser').value,ac=$('aAccion').value;
  const rows=a.filter(x=>(!u||x.email===u)&&(!ac||x.accion===ac)&&(!s||(x.detalle+' '+x.email).toLowerCase().includes(s)));
  const shown=rows.slice(0,500);
  $('auditCount').textContent=ADMIN?`${rows.length} de ${a.length} cargadas`+(ADMIN.totalAuditoria>a.length?` · ${ADMIN.totalAuditoria} en total (se muestran las más recientes)`:''):'';
  $('auditBody').innerHTML=shown.map(x=>`<tr><td>${esc(x.fecha)}</td><td>${esc(x.email)}</td>
    <td><span class="spill" style="--c:var(${ACC_COLOR[x.accion]||'--muted'})"><i class="dot"></i>${esc(x.accion)}</span></td>
    <td>${x.leadId&&lead(x.leadId)?`<button type="button" class="linkish" style="text-align:left" data-act="lead" data-id="${esc(x.leadId)}" title="Abrir ficha">${esc(x.detalle)}</button>`:esc(x.detalle)}</td></tr>`).join('');
  $('auditEmpty').innerHTML=shown.length?(rows.length>shown.length?`<p class="empty">Mostrando 500 de ${rows.length}. Usa los filtros para acotar.</p>`:''):'<p class="empty">Sin acciones que coincidan.</p>';
}
['aQ','aUser','aAccion'].forEach(id=>$(id).addEventListener('input',renderAudit));
$('userForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const data={nombre:$('uNombre').value.trim(),email:$('uEmail').value.trim(),rol:$('uRol').value,uid:$('uUid').value.trim()};
  if(!data.nombre){toast('Escribe el nombre',true);$('uNombre').focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){toast('Escribe un email válido',true);$('uEmail').focus();return}
  if(data.rol==='admin'&&!confirm(`${data.nombre} será ADMINISTRADOR: podrá ver el registro y gestionar usuarios. ¿Continuar?`))return;
  $('uBtn').setAttribute('aria-busy','true');
  try{
    const r=await api('createUser',data);
    setAdmin(r.admin);$('userForm').reset();
    toast(r.nuevo?(r.enviado?`Usuario creado. ${data.email} recibirá un email para poner su contraseña`:'Usuario creado, pero no se pudo enviar el email: usa “✉ Contraseña”')
      :`Acceso dado a ${data.email}: ya tenía cuenta, entra con su contraseña de siempre`);
  }catch(err){}finally{$('uBtn').removeAttribute('aria-busy')}
});

// ───── arrastrar tarjetas (Flujo de trabajo y Facturación) ─────
let dragId=null;
function bindDrag(box,onDrop){
  box.addEventListener('dragstart',e=>{const c=e.target.closest('.kcard');if(!c)return;dragId=c.dataset.id;c.classList.add('dragging');e.dataTransfer.effectAllowed='move'});
  box.addEventListener('dragend',e=>{const c=e.target.closest('.kcard');if(c)c.classList.remove('dragging')});
  box.addEventListener('dragover',e=>{const col=e.target.closest('.col');if(!col)return;e.preventDefault();
    box.querySelectorAll('.col.over').forEach(x=>x!==col&&x.classList.remove('over'));col.classList.add('over')});
  box.addEventListener('dragleave',e=>{const col=e.target.closest('.col');if(col&&!col.contains(e.relatedTarget))col.classList.remove('over')});
  box.addEventListener('drop',e=>{const col=e.target.closest('.col');if(!col||!dragId)return;e.preventDefault();col.classList.remove('over');
    const l=lead(dragId);dragId=null;if(l)onDrop(l,col).catch(()=>{})});
}
// Flujo de trabajo: cambia la etapa
bindDrag($('kanban'),async(l,col)=>{
  const etapa=col.dataset.etapa;if(l.etapa===etapa)return;
  // Para "Perdido" se abre la ficha: hay que indicar el motivo antes de guardar.
  if(etapa==='Perdido'){openLead(l.id,{etapa:'Perdido'});toast('Indica por qué no se ganó y guarda');return}
  const prev=l.etapa;l.etapa=etapa;renderAll();
  try{setData(await api('setEtapa',l.id,etapa),l.id);toast(l.nombre+' → '+etapa+(etapa==='Facturado'?' · pendiente de pago':''))}catch(err){l.etapa=prev;renderAll()}
});
// Facturación: cambia el estado de pago
bindDrag($('kanbanPago'),async(l,col)=>{
  const pago=col.dataset.pago;if((l.estadoPago||'Pendiente de pago')===pago)return;
  const prev=l.estadoPago;l.estadoPago=pago;renderAll();
  try{setData(await api('setPago',l.id,pago),l.id);toast(l.nombre+' → '+pago+(pago==='Pagado'?' 💶':''))}catch(err){l.estadoPago=prev;renderAll()}
});

// ───── menú hamburguesa ─────
// Escritorio: alterna entre menú de iconos y menú con nombres (se recuerda). Móvil: abre/cierra el panel lateral.
const MQ=matchMedia('(max-width:760px)');
const isMobile=()=>MQ.matches;
function navOpen(){return isMobile()?document.body.classList.contains('nav-open'):document.body.classList.contains('nav-wide')}
function setNav(open){
  if(isMobile())document.body.classList.toggle('nav-open',open);
  else{document.body.classList.toggle('nav-wide',open);try{localStorage.setItem('crm-nav',open?'wide':'rail')}catch(e){}setTimeout(renderProgress,320)}
  $('burger').setAttribute('aria-expanded',String(open));
}
function segOn(el){el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el))}
$('burger').addEventListener('click',()=>setNav(!navOpen()));
$('navBackdrop').addEventListener('click',()=>setNav(false));
MQ.addEventListener('change',()=>{document.body.classList.remove('nav-open');$('burger').setAttribute('aria-expanded',String(navOpen()));renderProgress()});
try{if(localStorage.getItem('crm-nav')==='wide')document.body.classList.add('nav-wide')}catch(e){}
$('burger').setAttribute('aria-expanded',String(navOpen()));

// ───── tema ─────
function applyTheme(t,save){
  document.documentElement.dataset.theme=t;
  $('themeBtn').innerHTML=(t==='light'?ICON.moon:ICON.sun)+`<span class="sr" id="themeLbl">${t==='light'?'Tema oscuro':'Tema claro'}</span>`;
  $('themeBtn').title=t==='light'?'Cambiar a tema oscuro':'Cambiar a tema claro';
  if(save)try{localStorage.setItem('yk-demo-theme',t)}catch(e){}
  renderProgress();
}

// ───── arranque de la demo ─────
// Parámetros (también los usan las capturas automáticas):
//   ?lang=es|en  ?theme=dark|light  ?view=dashboard|pipeline|facturacion|calendario|usuarios|registro
//   ?cal=mes|semana|dia  ?open=lead|recibo  ?nav=wide  ?shot=1 (sin animaciones ni banner)
const QS=new URLSearchParams(location.search);
function resetDemo(){DemoBackend.init(LANG);setData(DemoBackend.iniciarSesion())}
ACTIONS.logout=()=>{if(!confirm('¿Reiniciar la demo? Se borrarán los cambios que hiciste.'))return;resetDemo();toast('Demo reiniciada')};
(function boot(){
  let theme=QS.get('theme');if(!theme)try{theme=localStorage.getItem('yk-demo-theme')}catch(e){}
  applyTheme(theme==='light'?'light':'dark');
  if(QS.has('shot'))document.body.classList.add('shot');
  resetDemo();
  document.body.classList.remove('locked');
  if(QS.get('nav')==='wide')setNav(true);
  if(QS.get('cal'))calView=QS.get('cal');
  const v=QS.get('view')||'dashboard';
  ACTIONS.nav(document.querySelector(`.nav[data-view="${v}"]`)||document.querySelector('.nav[data-view=dashboard]'));
  const open=QS.get('open');
  if(open==='lead')openLead(DemoBackend.featured('lead'));
  if(open==='recibo')openRecibo(DemoBackend.featured('recibo'));
})();