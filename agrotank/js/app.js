/* Agrotank · CRM de ventas y facturación (interfaz). Habla con el servidor solo a través de api(). */
const STAGES=['Nuevo','Contactado','Seguimiento','Presupuesto enviado','Reservado','Facturado','Perdido'];
const STAGE_COL={'Contactado':'fechaContactado','Seguimiento':'fechaSeguimiento','Presupuesto enviado':'fechaPresupuesto','Reservado':'fechaReservado','Facturado':'fechaFacturado','Perdido':'fechaPerdido'};
// Estado de pago de los Facturados (pestaña Facturación): [color, fecha que cuenta, verbo]
const PAGOS={'Pendiente de pago':['--pay-pend','fechaFacturado','facturados'],'Pagado':['--pay-ok','fechaPagado','cobrados']};
// Cobro de la reserva (factura de anticipo)
const reservaTag=f=>{const ok=(f.estadoPago||'Pendiente de pago')==='Pagado';return `<span class="temp" style="--tc:var(${ok?'--t-hot':'--t-warm'})">${ok?'Reserva pagada':'Reserva pendiente'}</span>`};
const reservasDe=id=>(DATA.facturas||[]).filter(f=>f.leadId===id&&f.subtipo==='Anticipo'&&f.estado==='Emitida');
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
// Acepta "1.234,50", "1234.5", "1.000" (mil) o "1000"
const toNum=s=>{let t=String(s||'').replace(/\s|€|%/g,'');if(/,\d{1,2}$/.test(t)||/^\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,'').replace(',','.');else t=t.replace(/,/g,'');const n=Number(t);return isFinite(n)?n:0};
// 2.940,30 € (con punto de miles también en cifras de 4 dígitos, como en las facturas)
const eur=n=>{const [e,d]=Math.abs(Number(n)||0).toFixed(2).split('.');return (n<0?'-':'')+e.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+d+' €'};
const fdate=s=>{const d=pd(s);return d?d.toLocaleDateString('es-ES'):'—'};
/** IVA aplicable al lead: el suyo o, si no tiene, el de la empresa. */
const ivaDe=l=>String(toNum(l.factIva!==''&&l.factIva!=null?l.factIva:((DATA.config||{}).ivaDefecto||21)));
/** Base, IVA y total de un lead (para tarjetas y resúmenes). */
function totales(l){const r=calc(lineasDe(l),ivaDe(l));return {base:r.base,iva:toNum(ivaDe(l)),cuota:r.cuota,total:r.total,hayImporte:r.base!==0}}

// ───── facturas (RD 1619/2012): factura, proforma y rectificativa ─────
const TIPOS_IVA=['21','10','4'];
const TIT={Factura:'FACTURA',Proforma:'FACTURA PROFORMA',Rectificativa:'FACTURA RECTIFICATIVA'};
const FORMA_TXT={Transferencia:'Transferencia bancaria'};
const H2P={src:'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',sri:'sha384-Yv5O+t3uE3hunW8uyrbpPW3iw6/5/Y7HitWJBLgqfMoA36NogMmy+8wWZMpn3HWc'};
// Logo de Agrotank redibujado en vectores (hexágono con campos de cultivo)
// (emblema en SVG con tamaño fijo + nombre en texto HTML: así sale igual en pantalla, al imprimir y en el PDF)
const AGRO_LOGO=`<svg class="agro-em" width="92" height="104" viewBox="55 7 90 106" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#7f8a74" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <defs><clipPath id="agroHx"><path d="M100 13 L141 37 L141 83 L100 107 L59 83 L59 37 Z"/></clipPath></defs>
  <path d="M96.5 11 Q100 9 103.5 11 L139.5 31.8 Q143 33.8 143 37.8 L143 82.2 Q143 86.2 139.5 88.2 L103.5 109 Q100 111 96.5 109 L60.5 88.2 Q57 86.2 57 82.2 L57 37.8 Q57 33.8 60.5 31.8 Z" stroke-width="3.6"/>
  <g clip-path="url(#agroHx)" stroke-width="2.2"><path d="M70 49 C76 47 80 45.5 86 46.5 S96 49 102 47 S110 45 116 46.5 S126 48 132 46"/><path d="M57 46.5 C78 47 101 52 122 70 C130 77 135 84 140 92"/><path d="M57 53.5 C74 55 90 59 104 67"/><path d="M57 61 C67 62.5 75 65 84 69"/><path d="M57 69 C61 70 64 71.5 67 73"/><path d="M143 46.5 C118 49 96 58 79 73 C72 79 67 85 63 92"/><path d="M143 53.5 C122 56 102 66 86 81 C80 87 76 92 73 98"/><path d="M143 61 C128 64 113 72 101 83 C96 88 92 93 89 99"/><path d="M143 69 C136 71 130 74 125 78"/><path d="M104 86 C108 89 112 94 115 100"/><path d="M114 79 C119 83 124 89 127 94"/></g></svg>
  <b class="agro-n">AGROTANK</b><span class="agro-k">1000</span>`;
/** Líneas del lead [{c,q,p}] (los leads antiguos con concepto/importe único se ven como 1 línea). */
const lineasDe=l=>{try{const a=JSON.parse(l.factLineas||'[]');if(a.length)return a}catch(e){}return l.factImporte||l.factConcepto?[{c:l.factConcepto||'',q:'1',p:l.factImporte||''}]:[]};
/** Igual que el servidor: céntimos exactos por línea, cuota redondeada al céntimo. */
function calc(lineas,iva){let b=0;const ls=lineas.map(x=>{const t=Math.round(toNum(x.q||1)*Math.round(toNum(x.p)*100));b+=t;return Object.assign({},x,{t:(t/100).toFixed(2)})});
  const c=Math.round(b*toNum(iva)/100);return {lineas:ls,base:b/100,cuota:c/100,total:(b+c)/100}}
/** Cuentas bancarias de la Configuración: [{id, iban, banco, titular, activa, predeterminada}] */
const cuentasAct=()=>(DATA.cuentas||[]).filter(c=>c.activa);
const cuentaPred=()=>{const a=cuentasAct();return a.find(c=>c.predeterminada)||a[0]||null};
/** Texto de la cuenta que se copia en la factura (igual que el servidor): "IBAN · banco · titular" */
function cuentaTexto(forma,id){if(forma!=='Transferencia')return '';const a=cuentasAct(),c=a.find(x=>x.id===id)||cuentaPred();return c?[c.iban,c.banco||'',c.titular||''].join(' · '):''}
const facturasDe=id=>(DATA.facturas||[]).filter(f=>f.leadId===id);
/** Facturas finales vigentes del lead (sin anticipos ni anuladas); la última es la "activa". */
const finalesDe=id=>(DATA.facturas||[]).filter(f=>f.leadId===id&&f.tipo==='Factura'&&f.subtipo!=='Anticipo'&&f.estado==='Emitida');
const activa=l=>l?finalesDe(l.id).slice(-1)[0]||null:null;
/** NIF español (DNI, NIE, CIF) con dígito de control, o NIF-IVA extranjero. Igual que en el servidor. */
function validNif(s){s=String(s||'').toUpperCase().replace(/[\s.\-]/g,'');const L='TRWAGMYFPDXBNJZSQVHLCKE';let m;
  if((m=s.match(/^(\d{8})([A-Z])$/)))return L[+m[1]%23]===m[2];
  if((m=s.match(/^([XYZ])(\d{7})([A-Z])$/)))return L[Number('XYZ'.indexOf(m[1])+m[2])%23]===m[3];
  if((m=s.match(/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/))){let sum=0;m[2].split('').forEach((d,i)=>{const n=+d;sum+=i%2?n:Math.floor(n*2/10)+(n*2)%10});const c=(10-sum%10)%10;return m[3]===String(c)||m[3]==='JABCDEFGHI'[c]}
  return /^(?!ES)[A-Z]{2}[A-Z0-9]{2,13}$/.test(s)}
const locTxt=(cp,pob,prov)=>[[cp,pob].filter(Boolean).join(' '),prov&&prov!==pob?prov:''].filter(Boolean).join(', ');
/** Anticipos (reservas) vigentes del lead que aún no se han descontado en una factura final. */
function anticiposPendientes(leadId,ignorar){const fs=DATA.facturas||[];
  const usados=fs.filter(f=>f.tipo==='Factura'&&f.estado==='Emitida'&&f.deduce&&f.numero!==ignorar).flatMap(f=>String(f.deduce).split(','));
  return fs.filter(f=>f.leadId===leadId&&f.subtipo==='Anticipo'&&f.estado==='Emitida'&&!usados.includes(f.numero))}
const fmtNum=n=>eur(n).replace(' €','');
/** Nombre del documento: "Factura", "Factura de anticipo", "Factura proforma"… */
const docLabel=f=>f.subtipo==='Anticipo'?'Factura de anticipo':cap(TIT[f.tipo].toLowerCase());
/** Documento ya emitido: copia fija guardada en el libro de facturas. */
const docFrom=f=>Object.assign({},f,{lineas:(()=>{try{return JSON.parse(f.lineas||'[]')}catch(e){return []}})(),base:toNum(f.base),cuota:toNum(f.cuota),total:toNum(f.total)});
/** Estado de cobro de una factura (las proformas y rectificativas no se cobran). */
const cobrable=f=>f.tipo==='Factura'&&f.estado==='Emitida';
const cobroTag=f=>{if(f.estado==='Anulada')return '<span class="temp" style="--tc:var(--t-out)">Anulada</span>';if(!cobrable(f))return '<span class="muted-s">—</span>';
  const ok=f.estadoPago==='Pagado';return `<span class="temp" style="--tc:var(${ok?'--t-hot':'--t-warm'})">${ok?'Cobrada '+fdate(f.fechaPago):'Pendiente de pago'}</span>`};
const qtyTxt=q=>{const n=toNum(q);return Number.isInteger(n)&&Math.abs(n)<10?(n<0?'-':'')+String(Math.abs(n)).padStart(2,'0'):n.toLocaleString('es-ES')};
/** El documento A4, con el diseño de las facturas de Agrotank. */
function docHtml(d){
  // Al pie solo el detalle del cobro. (Las proformas antiguas con condiciones de pago las siguen mostrando: no se cambia el pasado.)
  const [iban,banco,titular]=String(d.cuenta||'').split(/\s*[·|]\s*/),cond=String(d.condiciones||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const rect=d.tipo==='Rectificativa',ant=d.subtipo==='Anticipo';
  // En el anticipo la primera frase del concepto va en negrita, como en el modelo del cliente
  const concepto=c=>{if(!ant)return esc(c);const k=String(c).indexOf('.');return k>0?`<b>${esc(c.slice(0,k+1))}</b>${esc(c.slice(k+1))}`:esc(c)};
  return `<div class="fx ${ant?'fx-ant':''}">${d.estado==='Borrador'?'<div class="fx-wm">BORRADOR</div>':''}${d.estado==='Anulada'?'<div class="fx-stamp">ANULADA</div>':''}
    <div class="fx-top"><div><h1 class="fx-title ${d.tipo!=='Factura'?'long':''}">${TIT[d.tipo]}</h1>
      <div class="fx-meta">N.º de ${d.tipo==='Proforma'?'proforma':'factura'}: ${esc(d.numero||'—')}<br>Fecha: ${fdate(d.fecha)}${d.fechaOperacion?`<small>Fecha de la operación: ${fdate(d.fechaOperacion)}</small>`:''}</div></div>
      <div class="fx-logo">${AGRO_LOGO}</div></div>
    <section class="fx-cli"><h5>Cliente</h5><b class="fx-cname">${esc(d.clienteNombre)}</b><div>${esc([d.clienteNif,d.clienteDireccion].filter(Boolean).join('\n'))}</div></section>
    ${rect?`<div class="fx-rect"><b>${esc(d.notas)}</b><br>Motivo de la rectificación: ${esc(d.motivo)}</div>`:''}
    <table class="fx-lines"><thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>
      ${d.lineas.map(x=>`<tr><td>${concepto(x.c)}</td><td>${qtyTxt(x.q)}</td><td>${eur(toNum(x.p))}</td><td>${eur(toNum(x.t))}</td></tr>`).join('')}</tbody></table>
    ${d.notas&&!rect?`<p class="fx-notes">${esc(d.notas)}</p>`:''}
    <div class="fx-sum"><div><span>SUBTOTAL</span><b>${eur(d.base)}</b></div><div><span>IVA ${String(d.ivaPct).replace('.',',')} %</span><b>${eur(d.cuota)}</b></div><div><span>TOTAL</span><b>${eur(d.total)}</b></div></div>
    <div class="fx-foot"><div class="fx-em"><b>${esc(d.emisorNombre)}</b><span>${esc([d.emisorNif,d.emisorDireccion,d.emisorEmail].filter(Boolean).join('\n'))}</span></div>
      <div class="fx-pay">${ant?`<p class="fx-arras">${esc(d.condiciones)}</p>`:cond.length?`<p><b>Condiciones de pago:</b></p><ul>${cond.map(c=>{const m=c.match(/^([^:]{2,40}:)(.*)$/);return `<li>${m?`<b>${esc(m[1])}</b>${esc(m[2])}`:esc(c)}</li>`}).join('')}</ul>`:''}
        ${d.formaPago?`<p>Forma de pago: ${esc(FORMA_TXT[d.formaPago]||d.formaPago)}</p>`:''}${iban?`<p>IBAN: ${esc(iban)}</p>`:''}${banco?`<p>${esc(banco)}</p>`:''}${titular?`<p>Titular: ${esc(titular)}</p>`:''}</div></div>
    ${d.tipo==='Proforma'?'<p class="fx-legal">Factura proforma: documento informativo, sin validez como factura.</p>':''}</div>`}
/** Texto del documento para email y WhatsApp. */
function docTexto(d){const [iban,,titular]=String(d.cuenta||'').split(/\s*[·|]\s*/);
  return [`${docLabel(d)} n.º ${d.numero} · ${d.emisorNombre}`,`Fecha: ${fdate(d.fecha)}`,'',
    `Cliente: ${d.clienteNombre}${d.clienteNif?' ('+d.clienteNif+')':''}`,
    ...d.lineas.map(x=>`· ${d.subtipo==='Anticipo'?String(x.c).split('.')[0]:x.c} × ${qtyTxt(x.q)}: ${eur(toNum(x.t))}`),'',
    `Subtotal: ${eur(d.base)}`,`IVA ${String(d.ivaPct).replace('.',',')} %: ${eur(d.cuota)}`,`TOTAL: ${eur(d.total)}`,
    d.formaPago?`\nForma de pago: ${FORMA_TXT[d.formaPago]||d.formaPago}${iban?' · IBAN '+iban:''}${titular?' · Titular: '+titular:''}`:''].join('\n').trim()}
const pdfName=d=>`${docLabel(d)} ${d.numero} - ${d.clienteNombre}`.replace(/[\\/:*?"<>|]+/g,'').slice(0,90)+'.pdf';
function loadH2P(){return window.html2pdf?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');
  s.src=H2P.src;s.integrity=H2P.sri;s.crossOrigin='anonymous';s.referrerPolicy='no-referrer';s.onload=res;s.onerror=()=>rej(new Error('pdf'));document.head.appendChild(s)})}
/** PDF A4 del documento (se dibuja fuera de pantalla a tamaño real, sin el zoom de la vista). */
async function docPdf(d){await loadH2P();if(document.fonts)await document.fonts.ready;
  const box=document.createElement('div');box.style.cssText='position:fixed;left:-10000px;top:0;background:#fff';box.innerHTML=docHtml(d);document.body.appendChild(box);
  const fx=box.firstElementChild;fx.style.minHeight='1110px'; // un pelo menos que el A4 (1123 px) para que no salga una 2ª hoja en blanco
  try{return await html2pdf().set({margin:0,image:{type:'jpeg',quality:.96},html2canvas:{scale:2,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css']}}).from(fx).outputPdf('blob')}
  finally{box.remove()}}
/** Teléfono para WhatsApp: solo dígitos; los móviles españoles de 9 cifras llevan el prefijo 34. */
const waPhone=t=>{let d=String(t||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.length===9&&/^[6-9]/.test(d))d='34'+d;return d};
const tempTag=t=>TEMPS[t]?`<span class="temp" style="--tc:var(${TEMPS[t][0]})" title="${TEMPS[t][1]}">${t}</span>`:'';
const ICON={
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>',
  // Logo de la app: círculo blanco › círculo negro algo más pequeño › círculo blanco mucho más pequeño (en tema claro, invertido)
  logo:'<svg viewBox="55 7 90 106" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><clipPath id="agroSide"><path d="M100 13 L141 37 L141 83 L100 107 L59 83 L59 37 Z"/></clipPath></defs><path d="M96.5 11 Q100 9 103.5 11 L139.5 31.8 Q143 33.8 143 37.8 L143 82.2 Q143 86.2 139.5 88.2 L103.5 109 Q100 111 96.5 109 L60.5 88.2 Q57 86.2 57 82.2 L57 37.8 Q57 33.8 60.5 31.8 Z" stroke-width="6"/><g clip-path="url(#agroSide)" stroke-width="4"><path d="M70 49 C80 45 92 50 102 47 S120 44 132 46"/><path d="M57 46.5 C78 47 101 52 122 70 C130 77 135 84 140 92"/><path d="M57 58 C72 60 86 64 98 72"/><path d="M143 46.5 C118 49 96 58 79 73 C72 79 67 85 63 92"/><path d="M143 57 C122 60 103 70 88 84 C82 90 78 96 75 102"/><path d="M108 84 C113 89 117 95 120 101"/></g></svg>',
};

let DATA={hoy:'',leads:[],citas:[],historial:[],movimientos:[],config:{}};
let T=new Date();T.setHours(0,0,0,0);
let filtro='todos', tfiltro='', q='', fichaId=null, nuevoUso='', nuevaTemp='', lineasEd=[];

// ───── utilidades ─────
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pd=s=>{const [y,m,d]=String(s||'').slice(0,10).split('-').map(Number);return y&&m&&d?new Date(y,m-1,d):null};
const iso=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
const fmt=x=>x?x.toLocaleDateString('es-ES',{day:'2-digit',month:'short'}).replace('.',''):'—';
const ini=n=>String(n).trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
const lead=id=>DATA.leads.find(l=>l.id===id);
const cerrado=l=>l.etapa==='Facturado'||l.etapa==='Perdido';
const mondayOf=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const hm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const toMin=h=>{const [a,b]=String(h||'').split(':').map(Number);return isNaN(a)?null:a*60+(b||0)};
document.querySelectorAll('[data-ico]').forEach(e=>e.innerHTML=ICON[e.dataset.ico]);
$('brandSide').innerHTML=$('brandLogin').innerHTML=$('bootLogo').innerHTML=ICON.logo;
/** Pantalla de carga: se muestra al entrar y se va con un fundido cuando ya están los datos (o si falla). */
function bootOn(){const b=$('boot');clearTimeout(b._t);b.classList.remove('out');b.hidden=false}
function bootOff(){const b=$('boot');if(b.hidden)return;b.classList.add('out');clearTimeout(b._t);b._t=setTimeout(()=>{b.hidden=true;b.classList.remove('out')},380)}

// Cada llamada al servidor lleva el ID token de Firebase (se renueva solo antes de caducar).
// Servidor: Apps Script como API JSON. POST con text/plain para evitar la petición previa CORS.
async function api(fn,...args){
  const u=auth.currentUser;
  if(!u){lock('Tu sesión ha terminado. Vuelve a entrar.');throw new Error('sin sesión')}
  document.body.classList.add('busy');
  let token,j;
  try{token=await u.getIdToken()}catch(e){document.body.classList.remove('busy');lock('Tu sesión ha terminado. Vuelve a entrar.');throw e}
  try{
    const r=await fetch(window.AGRO_CONFIG.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({fn,token,args}),credentials:'omit',cache:'no-store',redirect:'follow'});
    j=await r.json();
  }catch(e){document.body.classList.remove('busy');toast('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',true);throw e}
  document.body.classList.remove('busy');
  if(j&&j.ok)return j.data;
  const m=String(j&&j.error||'Error al conectar');
  if(m==='No autorizado')lock('No tienes permiso para acceder a este CRM.');else toast(m,true);
  throw new Error(m);
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
const VIEW_PARTS={dashboard:['kpis','progChart','bento2','todayList','funnel','tbody'],pipeline:['stageCards','kanban'],facturacion:['payCards','kanbanPago','kanbanReserva'],facturas:['facCards','facBody'],config:['cfgForm','cfgHist'],calendario:['cal'],usuarios:['usersBody'],registro:['auditBody']};
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
  $('today').textContent='Hoy, '+T.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
  for(const k of ['vencido','porvencer','trabajar','aldia'])countTo($('k-'+k),DATA.leads.filter(l=>status(l)===k).length);
  renderBig();renderDonut();renderHoy();renderFunnel();renderFilters();renderTable();
  renderStageCards();renderKanban();renderPagos();renderFacturas();renderCal();renderProgress();
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
      <div class="kcard ${l.id===flashId?'flash':''}" draggable="true" style="--c:var(${STATUS[st][1]})" data-act="${l.etapa==='Facturado'?'recibo':'lead'}" data-id="${esc(l.id)}" title="${l.etapa==='Facturado'?(activa(l)?'Ver factura':'Emitir factura'):'Abrir ficha'}"><b>${esc(l.nombre)}</b>
      <small><span>${l.uso?usoIcon[l.uso]+' '+esc(l.uso):'—'}${dias!==null?` · ${dias===0?'hoy':dias+' d'} aquí`:''}</span><span style="color:var(${STATUS[st][1]})">${c?fmt(pd(c.fecha)):STATUS[st][0]}</span></small>${(m=>m?`<div class="meta" style="margin-top:8px">${m}</div>`:'')(tempTag(l.temperatura)+pagoTag(l)+(l.etapa!=='Facturado'&&reservasDe(l.id).length?reservaTag(reservasDe(l.id).slice(-1)[0]):''))}</div>`}).join('')}</div></div>`}).join('');
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
      <div class="kcard ${l.id===flashId?'flash':''}" draggable="true" style="--c:var(${c})" data-act="recibo" data-id="${esc(l.id)}" title="${activa(l)?'Ver factura':'Emitir factura'}"><b>${esc(l.nombre)}</b>
      <div class="precio">${activa(l)?eur(toNum(activa(l).total)):totales(l).hayImporte?eur(totales(l).total):l.precio?esc(l.precio):'<span class="muted-s" style="font-weight:600">Sin importe</span>'}${activa(l)?` <span class="muted-s" style="font-weight:600">· ${esc(l.factNumero)}</span>`:` <span class="temp" style="--tc:var(--t-warm)">Sin factura</span>`}</div>
      <small><span>${l.uso?usoIcon[l.uso]+' '+esc(l.uso):'—'}</span><span>${p==='Pagado'?'Cobrado':'Facturado'} ${f?fmt(f)+(dias>0?` · ${dias} d`:''):'—'}</span></small>
      ${l.temperatura?`<div class="meta" style="margin-top:8px">${tempTag(l.temperatura)}</div>`:''}</div>`}).join('')
      ||'<p class="empty" style="padding:6px 4px">Sin leads aquí.</p>'}</div></div>`}).join('');
  renderReservas();
}
/** Reservas: facturas de anticipo vigentes, por estado de cobro. */
function renderReservas(){
  const fs=(DATA.facturas||[]).filter(f=>f.subtipo==='Anticipo'&&f.estado==='Emitida'&&(l=>!l||match(l))(lead(f.leadId)));
  const usadas=(DATA.facturas||[]).filter(f=>f.estado==='Emitida'&&f.deduce).flatMap(f=>String(f.deduce).split(',').map(n=>[n,f.numero]));
  $('kanbanReserva').innerHTML=[['Pendiente de pago','Reserva pendiente','--pay-pend'],['Pagado','Reserva pagada','--pay-ok']].map(([p,tit,c])=>{
    const ls=fs.filter(f=>(f.estadoPago||'Pendiente de pago')===p).sort((a,b)=>String(b.fechaPago||b.fecha).localeCompare(String(a.fechaPago||a.fecha)));
    return `<div class="col" data-pago="${p}" style="--sc:var(${c})"><h3>${tit}<span>${ls.length}</span></h3><div class="cards">${ls.map(f=>{
      const d=usadas.find(x=>x[0]===f.numero);return `
      <div class="kcard" draggable="true" style="--c:var(${c})" data-act="doc-open" data-n="${esc(f.numero)}" data-id="${esc(f.numero)}" title="Ver factura de anticipo"><b>${esc((lead(f.leadId)||{}).nombre||f.clienteNombre)}</b>
      <div class="precio">${eur(toNum(f.total))} <span class="muted-s" style="font-weight:600">· ${esc(f.numero)}</span></div>
      <small><span>${p==='Pagado'?'Cobrada '+fdate(f.fechaPago):'Emitida '+fdate(f.fecha)}</span><span>${d?'Descontada en '+esc(d[1]):'Por descontar'}</span></small></div>`}).join('')
      ||'<p class="empty" style="padding:6px 4px">Sin reservas aquí.</p>'}</div></div>`}).join('');
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
      return {label:a.toLocaleDateString('es-ES',{month:'short'}).replace('.',''),tip:cap(a.toLocaleDateString('es-ES',{month:'long',year:'numeric'})),v:ev.filter(d=>d>=a&&d<b).length,cur:i===11}}),unit:'este mes',prevUnit:'frente al mes anterior'};
  // Día de la semana: barras = esta semana (lunes a domingo); línea = promedio de las 8 semanas anteriores
  return {slots:DOW.map((n,i)=>{const day=addDays(wk0,i),nxt=addDays(day,1);
    let sum=0;for(let w=1;w<=AVG_WEEKS;w++){const a=addDays(day,-7*w),b=addDays(a,1);sum+=ev.filter(d=>d>=a&&d<b).length}
    return {label:n,tip:cap(day.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'short'})),v:ev.filter(d=>d>=day&&d<nxt).length,
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
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc($('progSum').textContent.replace(/\s+/g,' '))}">
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
  $('calTitle').textContent=calView==='dia'?cap(a.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))
    :(a.getMonth()===b.getMonth()?`${a.getDate()} – ${b.getDate()} de ${a.toLocaleDateString('es-ES',{month:'long',year:'numeric'})}`
      :`${fmt(a)} – ${fmt(b)} ${b.getFullYear()}`);
  $('calHint').textContent='Toca una hora libre para agendar una cita en ese momento · toca una cita para abrir la ficha del cliente.';
  renderTimeGrid(days);
}
function renderMonth(){
  const base=new Date(calDate.getFullYear(),calDate.getMonth(),1),m=base.getMonth();
  $('calTitle').textContent=cap(base.toLocaleDateString('es-ES',{month:'long',year:'numeric'}));
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
    <div class="tg-head"><div></div>${days.map(d=>`<button class="tg-dh ${iso(d)===iso(T)?'today':''}" data-act="cal-day" data-fecha="${iso(d)}"><span>${d.toLocaleDateString('es-ES',{weekday:'short'}).replace('.','')}</span><b>${d.getDate()}</b></button>`).join('')}</div>
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
  const act=id?activa(base):null,docs=id?facturasDe(id).slice().reverse():[];
  // Líneas que se editan en la ficha (si no hay, se propone el concepto con el uso y la capacidad)
  lineasEd=lineasDe(l).map(x=>({c:x.c||'',q:String(x.q||'1'),p:x.p?toNum(x.p).toLocaleString('es-ES',{minimumFractionDigits:2}):''}));
  if(!lineasEd.length)lineasEd=[{c:l.uso?`CISTERNA FLEXIBLE ${l.uso.toUpperCase()}${l.capacidad?' '+l.capacidad:''}`:'',q:'1',p:''}];
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
     <div class="acts">${pagoTag(base)}${act?`<button class="btn sm ghost" data-act="doc-open" data-n="${esc(act.numero)}">🧾 Factura</button>`:''}${id&&!cerrado(base)?`<button class="btn sm win" data-act="lead-won">🧾 Facturado</button><button class="btn sm lose" data-act="lead-lost">✕ Perdido</button>`:''}
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
      ${id?(()=>{const rs=reservasDe(id);
        // Reserva: su cobro también se ve y se cambia aquí (pendiente de pago ↔ pagada)
        if(rs.length)return `<div class="res-box"><span class="res-tit">Reserva</span>${rs.map(f=>{const ok=f.estadoPago==='Pagado';return `<div class="res-row">
          <span><button type="button" class="linkish" data-act="doc-open" data-n="${esc(f.numero)}">${esc(f.numero)}</button> · <b>${eur(toNum(f.total))}</b> ${reservaTag(f)}${ok&&f.fechaPago?` <small class="muted-s">el ${fdate(f.fechaPago)}</small>`:''}</span>
          <button type="button" class="btn sm ${ok?'ghost':'emit'}" data-act="res-pago" data-n="${esc(f.numero)}" data-v="${ok?'Pendiente de pago':'Pagado'}">${ok?'Marcar pendiente':'✓ Marcar pagada'}</button></div>`}).join('')}</div>`;
        return base.etapa==='Reservado'?`<div class="res-box warn"><span>Aún no se ha emitido la factura de reserva.</span>
          <button type="button" class="btn sm emit" data-act="fac-from-lead" data-tipo="Anticipo">🔖 Hacer la reserva</button></div>`:''})():''}
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
    <div class="sec full"><h4>Facturación</h4>
      ${docs.length?`<div class="docs">${docs.map(f=>`<div class="doc-row ${f.estado==='Anulada'?'anulada':''}"><span><b>${esc(docLabel(f))} ${esc(f.numero)}</b>
        <span class="muted-s"> · ${fdate(f.fecha)} · ${eur(toNum(f.total))}</span> ${cobroTag(f)}</span>
        <button class="btn sm ghost" data-act="doc-open" data-n="${esc(f.numero)}">Ver</button></div>`).join('')}</div>`:''}
      <p class="muted-s" style="margin-bottom:12px">Estos datos y el pedido rellenan solos las facturas nuevas de este cliente. Cambiarlos no afecta a las ya emitidas.</p>
      ${base.reciboAntiguo?`<p class="muted-s" style="margin-bottom:12px">Recibo anterior al sistema de facturas: ${esc(base.reciboAntiguo)}</p>`:''}
      <div class="fact-grid">
        <div class="field span2"><label for="fFNombre">Nombre o razón social</label><input id="fFNombre" value="${esc(l.factNombre)}" maxlength="150" placeholder="${esc(l.nombre||'Como figura en la factura')}"></div>
        <div class="field"><label for="fFNif">NIF / CIF</label><input id="fFNif" value="${esc(l.factNif)}" maxlength="20" autocapitalize="characters"><small class="muted-s" id="fFNifOk"></small></div>
        <div class="field span2"><label for="fFDir">Dirección</label><input id="fFDir" value="${esc(l.factDireccion)}" maxlength="200" placeholder="Calle, número, piso y puerta"></div>
        <div class="field"><label for="fFCP">Código postal</label><input id="fFCP" value="${esc(l.factCP)}" maxlength="10" inputmode="numeric"></div>
        <div class="field"><label for="fFPob">Población</label><input id="fFPob" value="${esc(l.factPoblacion)}" maxlength="80"></div>
        <div class="field"><label for="fFProv">Provincia</label><input id="fFProv" value="${esc(l.factProvincia)}" maxlength="80"></div>
        <div class="field"><label for="fFEmail">Email de facturación</label><input id="fFEmail" type="email" value="${esc(l.factEmail)}" maxlength="120" placeholder="${esc(l.email||'')}"></div>
      </div>
      <div class="field"><label>Pedido <span class="muted-s" style="font-weight:500">· líneas con precio sin IVA</span></label>
        <div class="lines-ed" id="fLines"></div>
        <button type="button" class="btn ghost sm" data-act="line-add">+ Añadir línea</button></div>
      <div class="fact-grid">
        <div class="field span2"><label for="fFNotas">Observaciones <span class="muted-s" style="font-weight:500">· salen bajo las líneas</span></label><input id="fFNotas" value="${esc(l.factNotas)}" maxlength="300" placeholder="Ej. Transporte incluido"></div>
        <div class="field"><label for="fFIva">IVA</label><select id="fFIva"><option value="">Por defecto (${esc(toNum((DATA.config||{}).ivaDefecto||21))} %)</option>${TIPOS_IVA.map(v=>`<option value="${v}" ${l.factIva!==''&&l.factIva!=null&&String(toNum(l.factIva))===v?'selected':''}>${v} %</option>`).join('')}</select></div>
        <div class="field"><label for="fFForma">Forma de pago</label><select id="fFForma"><option value="">—</option>${FORMAS_PAGO.map(f=>`<option value="${f}" ${f===l.factFormaPago?'selected':''}>${FORMA_TXT[f]||f}</option>`).join('')}</select></div>
      </div>
      <div class="fact-total"><span id="fFDesglose"></span><b id="fFTotal"></b></div>
      ${id?`<div class="factions" style="justify-content:flex-start">
        ${act?`<button class="btn sm ghost" data-act="doc-open" data-n="${esc(act.numero)}">🧾 Ver factura ${esc(act.numero)}</button>`:''}
        <button class="btn sm emit" data-act="fac-from-lead" data-tipo="Factura">🧾 Nueva factura</button>
        ${base.etapa!=='Perdido'?'<button class="btn ghost sm" data-act="fac-from-lead" data-tipo="Anticipo">🔖 Reserva</button><button class="btn ghost sm" data-act="fac-from-lead" data-tipo="Proforma">📄 Proforma</button>':''}</div>`:''}
    </div>
   </div>
   ${id&&!docs.some(f=>f.tipo!=='Proforma')?`<div class="danger-zone"><span>Eliminar el lead borra también sus citas, notas y movimientos. No se puede deshacer.</span>
     <button class="btn danger sm" data-act="lead-del">Eliminar lead</button></div>`:''}
   <div class="factions"><button class="btn ghost" data-act="close-lead">Cerrar</button><button class="btn" data-act="lead-save" id="saveBtn">${id?'Guardar cambios':'Crear lead'}</button></div>`;
  // Líneas y total en vivo mientras se escribe
  renderLineas(false);
  $('fLines').addEventListener('input',e=>{const i=e.target.dataset.i,k=e.target.dataset.k;if(i==null)return;lineasEd[i][k]=e.target.value;recalcFact()});
  $('fFIva').addEventListener('change',recalcFact);
  const nifChk=()=>{const v=$('fFNif').value.trim();$('fFNifOk').textContent=v?(validNif(v)?'✓ NIF válido':'⚠ Revisa el NIF: la letra o el dígito de control no cuadran'):''};
  $('fFNif').addEventListener('input',nifChk);nifChk();
  recalcFact();
  $('fEtapa').addEventListener('change',()=>{const v=$('fEtapa').value;
    $('lostBox').hidden=v!=='Perdido';$('payBox').hidden=v!=='Facturado';if(!$('lostBox').hidden)$('fMotivo').focus()});
  showOv('ovLead');
  if(!id)setTimeout(()=>$('fNombre').focus(),50);
  if(preset&&preset.etapa==='Perdido')setTimeout(()=>$('fMotivo').focus(),80);
}
function closeLead(){fichaId=null;hideOv('ovLead')}
function refreshFicha(){if(fichaId&&$('ovLead').classList.contains('open'))openLead(fichaId)}
/** Editor de líneas de la ficha: concepto · cantidad · precio sin IVA · total. */
function renderLineas(locked){
  $('fLines').innerHTML=`<div class="ln ln-head"><span>Concepto</span><span>Cant.</span><span>Precio</span><span class="lt">Total</span><span></span></div>`+
    lineasEd.map((x,i)=>`<div class="ln"><input data-i="${i}" data-k="c" value="${esc(x.c)}" maxlength="200" placeholder="Ej. Cisterna flexible agua 5 m³" aria-label="Concepto de la línea ${i+1}">
      <input data-i="${i}" data-k="q" value="${esc(x.q)}" inputmode="decimal" maxlength="8" placeholder="Cant." aria-label="Cantidad">
      <input data-i="${i}" data-k="p" value="${esc(x.p)}" inputmode="decimal" maxlength="14" placeholder="Precio 0,00" aria-label="Precio sin IVA">
      <span class="lt" id="lt${i}"></span>
      ${locked||lineasEd.length<2?'<span></span>':`<button type="button" class="mini" data-act="line-del" data-i="${i}" title="Quitar línea" aria-label="Quitar línea ${i+1}">✕</button>`}</div>`).join('');
}
function recalcFact(){if(!$('fLines'))return;
  const iva=$('fFIva').value||String(toNum((DATA.config||{}).ivaDefecto||21)),r=calc(lineasEd.filter(x=>x.c||x.p),iva);
  lineasEd.forEach((x,i)=>{const t=Math.round(toNum(x.q||1)*Math.round(toNum(x.p)*100))/100;if($('lt'+i))$('lt'+i).textContent=x.p?eur(t):''});
  $('fFDesglose').textContent=r.base?`Subtotal ${eur(r.base)} + IVA ${iva} % (${eur(r.cuota)})`:'Escribe el precio para calcular el total';
  $('fFTotal').textContent=r.base?eur(r.total):'—'}
async function saveLead(btn,after){
  const v=id=>$(id).value.trim();
  const mot=v('fMotivo'),motTxt=v('fMotivoTxt');
  const data={id:fichaId,nombre:v('fNombre'),telefono:v('fTel'),email:v('fEmail'),uso:nuevoUso,etapa:$('fEtapa').value,
    capacidad:v('fCap'),espacio:v('fEsp'),cuando:v('fCuando'),precio:v('fPrecio'),origen:$('fOrigen').value,
    motivoPerdida:mot?(motTxt?mot+' — '+motTxt:mot):motTxt,temperatura:nuevaTemp,
    estadoPago:$('fEtapa').value==='Facturado'?$('fPago').value:'',
    factNombre:v('fFNombre'),factNif:v('fFNif'),factEmail:v('fFEmail'),factDireccion:v('fFDir'),factCP:v('fFCP'),
    factPoblacion:v('fFPob'),factProvincia:v('fFProv'),factIva:$('fFIva').value,factFormaPago:$('fFForma').value,
    factLineas:lineasEd.filter(x=>x.c.trim()||x.p.trim()).map(x=>({c:x.c.trim(),q:x.q.trim()||'1',p:x.p.trim()})),
    factNotas:v('fFNotas'),factCuenta:(lead(fichaId)||{}).factCuenta,factFechaOperacion:(lead(fichaId)||{}).factFechaOperacion,
    reservaImporte:(lead(fichaId)||{}).reservaImporte,
    nota:v('fNota')}; // la nota escrita y no añadida aún también se guarda (no se pierde nada)
  if(!data.nombre){toast('El nombre es obligatorio',true);$('fNombre').focus();return}
  if(data.etapa==='Perdido'&&!data.motivoPerdida){toast('Indica por qué no se ganó el lead',true);$('fMotivo').focus();return}
  btn.setAttribute('aria-busy','true');
  try{const r=await api('saveLead',data);setData(r.data,r.id);
    if(after){closeLead();after(r.id);return}
    openLead(r.id);
    toast(!data.id?'Lead creado · ya puedes agendarle una cita':data.etapa==='Facturado'&&lead(r.id)?'Lead facturado · ahora puedes emitir la factura':'Cambios guardados')}
  catch(e){btn.removeAttribute('aria-busy')}
}

/// ───── documento: ver, emitir, cobrar, corregir, anular, PDF y compartir ─────
let reciboId=null,docCur=null;
/** o = {numero} para un documento emitido, o {draft} para la vista previa que viene del editor de facturas. */
function openDoc(o){
  let d,l;
  if(o.numero){const f=(DATA.facturas||[]).find(x=>x.numero===o.numero);if(!f)return;d=docFrom(f);l=lead(f.leadId)}
  else{d=o.draft;l=lead(d.leadId)}
  docCur={d,leadId:l?l.id:d.leadId};reciboId=docCur.leadId;
  const borr=d.estado==='Borrador',admin=DATA.yo&&DATA.yo.rol==='admin',faltan=borr?feFaltan(d):[];
  const corr=borr&&facEd&&facEd.modo==='corregir';
  const rect=d.estado==='Anulada'?(DATA.facturas||[]).find(f=>f.tipo==='Rectificativa'&&f.rectificaA===d.numero):null;
  const emailCli=l?(l.factEmail||l.email):'',tel=l?waPhone(l.telefono):'',texto=borr?'':docTexto(d);
  const asunto=`${docLabel(d)} ${d.numero} · ${d.emisorNombre}`;
  const mail=`mailto:${encodeURIComponent(emailCli||'')}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto+'\n\n(Se adjunta el PDF)')}`;
  const wa=`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
  const ant=d.subtipo==='Anticipo',pag=d.estadoPago==='Pagado';
  const titulo=borr?(corr?`Corrección de la factura ${facEd.orig}`:`Vista previa · ${docLabel(d)}`):`${docLabel(d)} ${d.numero}`;
  const emitTxt=corr?'✓ Guardar corrección':d.tipo==='Factura'?(ant?'🔖 Emitir reserva ':'🧾 Emitir factura ')+esc(DATA.siguienteFactura||''):'📄 Emitir proforma';
  $('reciboBox').innerHTML=`
    <div class="doc-bar no-print"><h3>${esc(titulo)}</h3>${!borr&&cobrable(d)?cobroTag(d):''}
      <button class="icon-btn" data-act="close-recibo" aria-label="Cerrar" style="background:var(--card-2)">✕</button></div>
    ${borr?(faltan.length?`<div class="rc-warn no-print">⚠ Falta: ${esc(faltan.join('; '))}.</div>`
      :`<div class="rc-ok no-print">${corr?`Al guardar se emite la rectificativa que anula la ${esc(facEd.orig)} y esta factura nueva${d.tipo==='Factura'?` (será la <b>${esc(DATA.siguienteFactura||'')}</b>)`:''}. Queda registrado el motivo y qué cambió.`
        :`Revisa los datos. Al pulsar “Emitir” recibe su número${d.tipo==='Factura'?` (será la <b>${esc(DATA.siguienteFactura||'')}</b>)`:''} y queda guardada sin cambios posibles.${d.tipo==='Factura'&&facEd?(facEd.cobro==='Pagado'?` Quedará como <b>pagada el ${esc(fdate(facEd.cobroFecha||DATA.hoy))}</b>.`:' Quedará <b>pendiente de pago</b>.'):''}`}${d.deduce?' Se descuentan las reservas '+esc(d.deduce.replace(/,/g,', '))+'.':''}</div>`):''}
    ${!borr&&cobrable(d)?`<div class="${pag?'rc-ok':'rc-warn'} no-print cobro-bar">
      ${pag?`<span>✓ ${ant?'Reserva cobrada':'Cobrada'} el ${fdate(d.fechaPago)}</span>
        <button class="btn sm ghost" data-act="doc-cobro" data-v="Pendiente de pago">Marcar como pendiente</button>`
      :`<span>${ant?'Reserva pendiente de cobro':'Pendiente de cobro'}</span>
        <label class="cobro-fecha">Cobrada el <input type="date" id="cobroFecha" value="${esc(DATA.hoy)}" max="${esc(DATA.hoy)}"></label>
        <button class="btn sm emit" data-act="doc-cobro" data-v="Pagado">✓ Marcar como cobrada</button>`}</div>`:''}
    ${rect?`<div class="rc-warn no-print">Anulada con la factura rectificativa ${esc(rect.numero)} · motivo: ${esc(rect.motivo)}</div>`:''}
    <div class="doc-paper" id="docPaper">${docHtml(d)}</div>
    <div class="rc-actions no-print">${borr?`
      <button class="btn emit" data-act="doc-emit" ${faltan.length?'disabled':''}>${emitTxt}</button>
      <button class="btn ghost" data-act="fe-back">← Volver a editar</button>
      <button class="btn ghost" data-act="close-recibo">Cancelar</button>`:`
      <button class="btn emit" data-act="doc-pdf">⬇ PDF</button>
      <a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener" title="${tel?'Enviar a +'+esc(tel):'Elige el contacto en WhatsApp'}">WhatsApp</a>
      <a class="btn mail" href="${esc(mail)}" target="_blank" rel="noopener" title="${emailCli?'Enviar a '+esc(emailCli):'Elige el destinatario en tu app de correo'}">✉ Email</a>
      <button class="btn ghost" data-act="recibo-print">Imprimir</button>
      <button class="btn ghost" data-act="recibo-copy">Copiar texto</button>
      ${l?'<button class="btn ghost" data-act="recibo-edit">Abrir ficha</button>':''}
      ${admin&&d.tipo==='Factura'&&d.estado==='Emitida'?`<button class="btn ghost" data-act="doc-corregir">✎ Corregir</button>
        <button class="btn danger" data-act="doc-anular">Anular (rectificativa)</button>`:''}`}
    </div>`;
  showOv('ovRecibo');fitDoc();$('reciboBox').scrollTop=0;
}
/** El A4 se reduce para caber en pantallas pequeñas (el PDF y la impresión salen a tamaño real). */
function fitDoc(){const p=$('docPaper');if(!p)return;const fx=p.querySelector('.fx'),cs=getComputedStyle(p);
  fx.style.zoom=Math.min(1,(p.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))/794)}
addEventListener('resize',()=>{if($('ovRecibo').classList.contains('open'))fitDoc()});
function closeRecibo(){reciboId=null;docCur=null;hideOv('ovRecibo')}
/** Tarjeta de un lead facturado: abre su factura vigente o, si aún no tiene, una factura nueva para él. */
function openRecibo(id){const l=lead(id);if(!l)return;const f=activa(l);
  if(f)openDoc({numero:f.numero});else openFacEd({leadId:id,tipo:'Factura'})}

// ───── editor de facturas: eliges el cliente → se rellena solo → vista previa → emitir ─────
let facEd=null;
const clienteDeLead=l=>({nombre:l.factNombre||l.nombre||'',nif:String(l.factNif||'').toUpperCase(),direccion:l.factDireccion||'',cp:l.factCP||'',
  poblacion:l.factPoblacion||'',provincia:l.factProvincia||'',email:l.factEmail||l.email||''});
const lineasEditables=ls=>ls.map(x=>({c:x.c||'',q:String(x.q||'1'),p:x.p!==''&&x.p!=null?toNum(x.p).toLocaleString('es-ES',{minimumFractionDigits:2}):''}));
const lineasPedido=l=>{const ls=lineasEditables(lineasDe(l));return ls.length?ls:[{c:l.uso?`CISTERNA FLEXIBLE ${l.uso.toUpperCase()}${l.capacidad?' '+l.capacidad:''}`:'',q:'1',p:''}]};
/** Cliente de una factura emitida: "dirección\nCP Población, Provincia" → campos. */
function clienteDeFactura(f,l){const ls=String(f.clienteDireccion||'').split('\n'),last=ls.length>1?ls.pop():'',m=last.match(/^(\S+)\s+([^,]+?)(?:,\s*(.+))?$/);
  const base=l?clienteDeLead(l):{};
  return {nombre:f.clienteNombre,nif:f.clienteNif,direccion:m?ls.join('\n'):String(f.clienteDireccion||''),cp:m?m[1]:base.cp||'',poblacion:m?m[2]:base.poblacion||'',
    provincia:m?(m[3]||m[2]):base.provincia||'',email:base.email||''}}

/** o = {leadId?, tipo?} para una factura nueva · {corrige: nº} para corregir una emitida. */
function openFacEd(o){
  o=o||{};
  if(o.corrige){
    const f=(DATA.facturas||[]).find(x=>x.numero===o.corrige);if(!f)return;const l=lead(f.leadId)||{},d=docFrom(f),ant=f.subtipo==='Anticipo';
    const [iban]=String(f.cuenta||'').split(/\s*[·|]\s*/),cta=(DATA.cuentas||[]).find(c=>c.iban===iban&&c.activa);
    facEd={modo:'corregir',orig:f.numero,leadId:f.leadId,tipo:ant?'Anticipo':'Factura',cliente:clienteDeFactura(f,l),
      lineas:ant?lineasPedido(l):lineasEditables(d.lineas.filter(x=>!/^Anticipo según factura/.test(x.c))),
      notas:f.notas||'',ivaPct:String(toNum(f.ivaPct)),formaPago:f.formaPago||'',cuentaId:cta?cta.id:'',fechaOperacion:f.fechaOperacion||'',
      reservaTotal:ant?toNum(f.total).toLocaleString('es-ES',{minimumFractionDigits:2}):'',deducir:String(f.deduce||'').split(',').filter(Boolean),
      guardarCliente:false,motivo:'',q:''};
  }else{
    facEd={modo:'nuevo',orig:'',leadId:'',tipo:o.tipo||'Factura',cliente:{},lineas:[],notas:'',ivaPct:String(toNum((DATA.config||{}).ivaDefecto||21)),
      formaPago:'Transferencia',cuentaId:'',fechaOperacion:'',reservaTotal:'',deducir:[],guardarCliente:false,motivo:'',q:'',
      // La reserva normalmente se cobra en el momento; la factura final suele quedar pendiente
      cobro:o.tipo==='Anticipo'?'Pagado':'Pendiente de pago',cobroFecha:DATA.hoy};
    if(o.leadId)feElegir(o.leadId,true);
  }
  renderFacEd();showOv('ovFactura');$('facBox').scrollTop=0;
  if(!facEd.leadId)setTimeout(()=>$('feQ')&&$('feQ').focus(),60);
}
/** Al elegir el cliente se rellena todo con lo que ya está guardado en su ficha. */
function feElegir(id,sinRender){const l=lead(id);if(!l)return;const e=facEd;
  Object.assign(e,{leadId:id,cliente:clienteDeLead(l),lineas:lineasPedido(l),notas:l.factNotas||'',ivaPct:ivaDe(l),
    formaPago:l.factFormaPago||'Transferencia',cuentaId:'',reservaTotal:'', // la reserva propone el 50 % del pedido
    
    deducir:anticiposPendientes(id).map(a=>a.numero),q:''});
  if(!sinRender)renderFacEd()}
function closeFacEd(){facEd=null;hideOv('ovFactura')}
function renderFacEd(){
  const e=facEd,l=e.leadId?lead(e.leadId):null,corr=e.modo==='corregir',c=e.cliente||{};
  const tipos=[['Factura','🧾 Factura'],['Anticipo','🔖 Reserva'],['Proforma','📄 Proforma']];
  const ants=l&&e.tipo==='Factura'?anticiposPendientes(e.leadId,corr?e.orig:''):[];
  const act=cuentasAct(),pred=cuentaPred();
  // Reserva: se propone el 50 % del pedido (IVA incluido) si aún no hay importe
  const mitad=l&&e.tipo==='Anticipo'?Math.round(calc(e.lineas.filter(x=>String(x.p).trim()),e.ivaPct).total*50)/100:0;
  if(l&&e.tipo==='Anticipo'&&!String(e.reservaTotal).trim()&&mitad>0)e.reservaTotal=mitad.toLocaleString('es-ES',{minimumFractionDigits:2});
  const fld=(id,lab,val,extra='',cls='')=>`<div class="field ${cls}"><label for="${id}">${lab}</label><input id="${id}" value="${esc(val||'')}" ${extra}></div>`;
  let h=`<div class="doc-bar"><h3>${corr?'Corregir factura '+esc(e.orig):'Nueva factura'}</h3>
    <button class="icon-btn" data-act="fac-close" aria-label="Cerrar" style="background:var(--card-2)">✕</button></div>`;
  if(corr)h+=`<div class="rc-warn">Una factura emitida no se puede modificar. Al guardar, la app emite una <b>rectificativa</b> que anula la ${esc(e.orig)} y una <b>factura nueva</b> con estos datos. El cobro se conserva y todo queda registrado con el motivo.</div>`;
  h+=`<div class="fe-sec"><h4>1 · Cliente</h4>`+(l?`<div class="fe-cli"><div class="avatar">${esc(ini(l.nombre))}</div><div><b>${esc(l.nombre)}</b>
      <small>${esc([l.telefono,l.email,l.etapa].filter(Boolean).join(' · '))}</small></div>${corr?'':'<button type="button" class="btn ghost sm" data-act="fe-cambiar">Cambiar</button>'}</div>`
    :`<input class="search" id="feQ" placeholder="Busca por nombre, teléfono, email o NIF…" value="${esc(e.q)}" autocomplete="off" aria-label="Buscar cliente"><div class="fe-res" id="feRes"></div>`)+`</div>`;
  if(l){
    h+=`<div class="fe-sec"><h4>2 · Documento</h4>`+(corr?`<p><b>${e.tipo==='Anticipo'?'Factura de anticipo (reserva)':'Factura'}</b></p>`
      :`<div class="seg fe-tipo">${tipos.map(([v,t])=>`<button type="button" class="${e.tipo===v?'on':''}" data-act="fe-tipo" data-v="${v}">${t}</button>`).join('')}</div>`)+`</div>`;
    h+=`<div class="fe-sec"><h4>3 · Datos fiscales del cliente</h4><div class="fact-grid">
      ${fld('feNombre','Nombre o razón social *',c.nombre,'maxlength="150"','span2')}
      <div class="field"><label for="feNif">NIF / CIF${e.tipo==='Proforma'?'':' *'}</label><input id="feNif" value="${esc(c.nif)}" maxlength="20" autocapitalize="characters"><small class="muted-s" id="feNifOk"></small></div>
      ${fld('feDir','Dirección'+(e.tipo==='Proforma'?'':' *'),c.direccion,'maxlength="200"','span2')}
      ${fld('feCP','Código postal'+(e.tipo==='Proforma'?'':' *'),c.cp,'maxlength="10" inputmode="numeric"')}
      ${fld('fePob','Población'+(e.tipo==='Proforma'?'':' *'),c.poblacion,'maxlength="80"')}
      ${fld('feProv','Provincia',c.provincia,'maxlength="80"')}
      ${fld('feEmail','Email',c.email,'type="email" maxlength="120"')}
      </div><label class="fe-check"><input type="checkbox" id="feGuardar" ${e.guardarCliente?'checked':''}> Guardar estos datos también en la ficha del cliente</label></div>`;
    h+=`<div class="fe-sec"><h4>4 · ${e.tipo==='Anticipo'?'Pedido <span class="muted-s">· para indicar su importe total</span>':'Líneas'} <span class="muted-s">· precios sin IVA</span></h4>
      <div class="lines-ed" id="feLines"></div><button type="button" class="btn ghost sm" data-act="fe-line-add">+ Añadir línea</button>
      ${e.tipo==='Anticipo'?`<div class="field" style="margin-top:12px;max-width:320px"><label for="feReserva">Importe de la reserva (IVA incluido) *</label><input id="feReserva" value="${esc(e.reservaTotal)}" inputmode="decimal" maxlength="14" placeholder="Ej. 300,00">
        ${mitad>0?`<small class="muted-s">50 % del pedido: ${eur(mitad)} · <button type="button" class="linkish" data-act="fe-mitad" data-v="${mitad}">usar 50 %</button></small>`:''}</div>`:''}
      ${ants.length?`<div class="fe-ants"><b>Reservas a descontar en esta factura</b>${ants.map(a=>`<label class="fe-check"><input type="checkbox" data-ant="${esc(a.numero)}" ${e.deducir.includes(a.numero)?'checked':''}>
        Reserva ${esc(a.numero)} · ${fdate(a.fecha)} · ${eur(toNum(a.total))} ${cobroTag(a)}</label>`).join('')}</div>`:''}</div>`;
    h+=`<div class="fe-sec"><h4>5 · Cobro</h4><div class="fact-grid">
      <div class="field"><label for="feIva">IVA</label><select id="feIva">${TIPOS_IVA.map(v=>`<option value="${v}" ${String(e.ivaPct)===v?'selected':''}>${v} %</option>`).join('')}</select></div>
      <div class="field"><label for="feForma">Forma de pago</label><select id="feForma"><option value="">—</option>${FORMAS_PAGO.map(f=>`<option value="${f}" ${f===e.formaPago?'selected':''}>${FORMA_TXT[f]||f}</option>`).join('')}</select></div>
      <div class="field" id="feCuentaBox" ${e.formaPago==='Transferencia'?'':'hidden'}><label for="feCuenta">Cuenta</label>${act.length?`<select id="feCuenta">${act.map(x=>`<option value="${esc(x.id)}" ${(e.cuentaId||(pred||{}).id)===x.id?'selected':''}>${esc(x.iban)}${x.banco?' · '+esc(x.banco):''}${x.predeterminada?' (predeterminada)':''}</option>`).join('')}</select>`
        :`<p class="muted-s">No hay ninguna cuenta. <button type="button" class="linkish" data-act="fe-ir-config">Añádela en Configuración</button></p>`}</div>
      ${e.tipo!=='Anticipo'?fld('feNotas','Observaciones <span class="muted-s" style="font-weight:500">· salen bajo las líneas</span>',e.notas,'maxlength="300" placeholder="Ej. Transporte incluido"','span2'):''}
      ${fld('feFechaOp','Fecha de la operación <span class="muted-s" style="font-weight:500">· solo si es distinta</span>',e.fechaOperacion,'type="date"')}
      ${e.tipo!=='Proforma'&&!corr?`<div class="field span3"><label>Estado del cobro${e.tipo==='Anticipo'?' de la reserva':''}</label>
        <div class="seg fe-cobro"><button type="button" class="${e.cobro==='Pagado'?'on':''}" data-act="fe-cobro" data-v="Pagado">✓ Pagada en el momento</button>
          <button type="button" class="${e.cobro!=='Pagado'?'on':''}" data-act="fe-cobro" data-v="Pendiente de pago">Pendiente de pago</button></div>
        ${e.cobro==='Pagado'?`<label class="cobro-fecha" style="margin-top:8px">Fecha del cobro <input type="date" id="feCobroFecha" value="${esc(e.cobroFecha)}" max="${esc(DATA.hoy)}"></label>`:''}</div>`:''}
      </div></div>`;
    if(corr)h+=`<div class="fe-sec"><h4>Motivo de la corrección *</h4><input class="search" id="feMotivo" value="${esc(e.motivo)}" maxlength="300" placeholder="Ej. El NIF del cliente estaba mal escrito"></div>`;
    h+=`<div class="fact-total"><span id="feDesglose"></span><b id="feTotal"></b></div>
      <div class="rc-actions fe-actions"><button type="button" class="btn ghost" data-act="fac-close">Cancelar</button><button type="button" class="btn emit" data-act="fe-preview">Vista previa →</button></div>`;
  }
  $('facBox').innerHTML=h;
  if(l){renderFeLines();feNif();feRecalc()}else feSearch();
}
function renderFeLines(){const e=facEd;
  $('feLines').innerHTML=`<div class="ln ln-head"><span>Concepto</span><span>Cant.</span><span>Precio</span><span class="lt">Total</span><span></span></div>`+
    e.lineas.map((x,i)=>`<div class="ln"><input data-fi="${i}" data-k="c" value="${esc(x.c)}" maxlength="200" placeholder="Ej. CISTERNA FLEXIBLE AGUA 5 m³" aria-label="Concepto de la línea ${i+1}">
      <input data-fi="${i}" data-k="q" value="${esc(x.q)}" inputmode="decimal" maxlength="8" placeholder="Cant." aria-label="Cantidad">
      <input data-fi="${i}" data-k="p" value="${esc(x.p)}" inputmode="decimal" maxlength="14" placeholder="Precio 0,00" aria-label="Precio sin IVA">
      <span class="lt" id="flt${i}"></span>
      ${e.lineas.length<2?'<span></span>':`<button type="button" class="mini" data-act="fe-line-del" data-i="${i}" title="Quitar línea" aria-label="Quitar línea ${i+1}">✕</button>`}</div>`).join('')}
function feSearch(){const e=facEd,s=String(e.q||'').trim().toLowerCase();
  const ls=DATA.leads.filter(l=>!s||[l.nombre,l.factNombre,l.telefono,l.email,l.factNif].join(' ').toLowerCase().includes(s))
    .sort((a,b)=>String(b.actualizado).localeCompare(String(a.actualizado))).slice(0,8);
  $('feRes').innerHTML=ls.map(l=>`<button type="button" class="fe-opt" data-act="fe-cli" data-id="${esc(l.id)}"><b>${esc(l.factNombre||l.nombre)}</b>
    <small>${esc([l.factNombre&&l.factNombre!==l.nombre?l.nombre:'',l.telefono,l.factNif,l.etapa].filter(Boolean).join(' · '))}</small></button>`).join('')
    ||'<p class="muted-s" style="padding:8px 4px">Ningún cliente coincide. Crea primero el lead con “Nuevo lead”.</p>'}
function feNif(){const v=String(facEd.cliente.nif||'').trim();if($('feNifOk'))$('feNifOk').textContent=v?(validNif(v)?'✓ NIF válido':'⚠ Revisa el NIF: la letra o el dígito de control no cuadran'):''}
function feRecalc(){if(!$('feTotal'))return;const d=feDoc();
  facEd.lineas.forEach((x,i)=>{const t=Math.round(toNum(x.q||1)*Math.round(toNum(x.p)*100))/100;if($('flt'+i))$('flt'+i).textContent=x.p?eur(t):''});
  $('feDesglose').textContent=d.base?`Subtotal ${eur(d.base)} + IVA ${d.ivaPct} % (${eur(d.cuota)})${d.deduce?' · descontadas las reservas':''}`:'Escribe el precio para calcular el total';
  $('feTotal').textContent=d.base?eur(d.total):'—'}
/** Documento en borrador con lo que hay en el editor (mismo cálculo que hará el servidor al emitirlo). */
function feDoc(){const e=facEd,cfg=DATA.config||{},iva=String(e.ivaPct),c=e.cliente||{};
  const lin=e.lineas.filter(x=>String(x.c).trim()||String(x.p).trim()).map(x=>({c:String(x.c).trim(),q:String(x.q).trim()||'1',p:String(x.p).trim()}));
  const t=calc(lin,iva);
  const d={numero:'',tipo:e.tipo==='Proforma'?'Proforma':'Factura',subtipo:e.tipo==='Anticipo'?'Anticipo':'',fecha:DATA.hoy,
    fechaOperacion:e.fechaOperacion&&e.fechaOperacion!==DATA.hoy?e.fechaOperacion:'',leadId:e.leadId,estado:'Borrador',rectificaA:'',motivo:'',
    emisorNombre:cfg.empresaNombre||'',emisorNif:cfg.empresaNif||'',emisorEmail:cfg.empresaEmail||'',
    emisorDireccion:[cfg.empresaDireccion,locTxt(cfg.empresaCP,cfg.empresaPoblacion,cfg.empresaProvincia)].filter(Boolean).join('\n'),
    clienteNombre:String(c.nombre||'').trim(),clienteNif:String(c.nif||'').toUpperCase().replace(/[\s.\-]/g,''),
    clienteDireccion:[String(c.direccion||'').trim(),locTxt(c.cp,c.poblacion,c.provincia)].filter(Boolean).join('\n'),
    lineas:t.lineas,notas:e.tipo==='Anticipo'?'':String(e.notas||'').trim(),base:t.base,ivaPct:iva,cuota:t.cuota,total:t.total,
    formaPago:e.formaPago,cuenta:cuentaTexto(e.formaPago,e.cuentaId),condiciones:'',pedidoTotal:t.total,lineasPedido:lin.length,deduce:''};
  if(e.tipo==='Anticipo'){const T=Math.round(toNum(e.reservaTotal)*100),b=Math.round(T*100/(100+toNum(iva))),base=(b/100).toFixed(2);
    Object.assign(d,{condiciones:cfg.textoReserva||'',lineas:[{c:String(cfg.conceptoReserva||'').replace('{pedido}',fmtNum(t.base)),q:'1',p:base,t:base}],base:b/100,cuota:(T-b)/100,total:T/100})}
  if(e.tipo==='Factura'&&e.deducir.length){const ants=(DATA.facturas||[]).filter(f=>e.deducir.includes(f.numero));
    const r=calc(lin.concat(ants.map(a=>({c:`Anticipo según factura n.º ${a.numero} de ${fdate(a.fecha)}`,q:'1',p:'-'+a.base}))),iva);
    // IVA del pedido completo menos el IVA ya cobrado en las reservas (igual que el servidor)
    const cu=Math.round(t.cuota*100)-ants.reduce((s,a)=>s+Math.round(toNum(a.cuota)*100),0);
    Object.assign(d,{lineas:r.lineas,base:r.base,cuota:cu/100,total:(Math.round(r.base*100)+cu)/100,deduce:ants.map(a=>a.numero).join(',')})}
  return d}
/** Lo que falta para poder emitir (mismas reglas que el servidor, para avisar antes). */
function feFaltan(d){const cfg=DATA.config||{},f=[],e=facEd||{},fact=d.tipo!=='Proforma',ant=d.subtipo==='Anticipo',c=e.cliente||{};
  if(!cfg.empresaNombre||!cfg.empresaNif||!cfg.empresaDireccion||!cfg.empresaCP||!cfg.empresaPoblacion)f.push('datos de la empresa (pestaña Configuración)');
  if(!d.clienteNombre)f.push('nombre del cliente');
  if(fact){if(!d.clienteNif)f.push('NIF/CIF del cliente');if(!String(c.direccion||'').trim()||!String(c.cp||'').trim()||!String(c.poblacion||'').trim())f.push('dirección, código postal y población del cliente')}
  if(d.clienteNif&&!validNif(d.clienteNif))f.push('un NIF/CIF del cliente válido (revisa la letra)');
  if(!d.lineasPedido)f.push(ant?'las líneas del pedido (para indicar su importe total)':'al menos una línea con concepto y precio');
  else if(ant){if(!(d.total>0))f.push('el importe de la reserva (IVA incluido)');else if(d.total>d.pedidoTotal)f.push('una reserva que no supere el total del pedido')}
  else if(!(d.base>0))f.push(d.deduce?'que las reservas no superen el importe de la factura':'un importe mayor que 0');
  if(!TIPOS_IVA.includes(String(d.ivaPct)))f.push('un IVA de 21, 10 o 4 %');
  if(d.formaPago==='Transferencia'&&!d.cuenta)f.push('una cuenta bancaria (pestaña Configuración)');
  if(e.modo==='corregir'&&!String(e.motivo||'').trim())f.push('el motivo de la corrección');
  if(fact&&e.modo!=='corregir'&&e.cobro==='Pagado'&&(!e.cobroFecha||e.cobroFecha>DATA.hoy))f.push('una fecha de cobro válida (no futura)');
  return f}
/** Lo que se envía al servidor (que vuelve a validar y calcular todo). */
function fePayload(){const e=facEd,c=e.cliente;
  return {tipo:e.tipo,leadId:e.leadId,cliente:{nombre:c.nombre,nif:c.nif,direccion:c.direccion,cp:c.cp,poblacion:c.poblacion,provincia:c.provincia,email:c.email},
    lineas:e.lineas.filter(x=>String(x.c).trim()||String(x.p).trim()).map(x=>({c:String(x.c).trim(),q:String(x.q).trim()||'1',p:String(x.p).trim()})),
    notas:e.notas,ivaPct:e.ivaPct,formaPago:e.formaPago,cuentaId:e.formaPago==='Transferencia'?(e.cuentaId||(cuentaPred()||{}).id||''):'',
    fechaOperacion:e.fechaOperacion,reservaTotal:e.reservaTotal,deducir:e.tipo==='Factura'?e.deducir:[],guardarCliente:e.guardarCliente,
    cobro:e.cobro,cobroFecha:e.cobro==='Pagado'?(e.cobroFecha||DATA.hoy):''}}
// Lo que se escribe en el editor va directo al estado (un solo oyente para toda la ventana)
$('facBox').addEventListener('input',ev=>{const t=ev.target,e=facEd;if(!e)return;
  const map={feNombre:'nombre',feNif:'nif',feDir:'direccion',feCP:'cp',fePob:'poblacion',feProv:'provincia',feEmail:'email'};
  if(t.id==='feQ'){e.q=t.value;feSearch();return}
  if(map[t.id]){e.cliente[map[t.id]]=t.value;if(t.id==='feNif')feNif()}
  else if(t.dataset.fi!=null)e.lineas[+t.dataset.fi][t.dataset.k]=t.value;
  else if(t.dataset.ant){const n=t.dataset.ant;e.deducir=t.checked?e.deducir.concat(n):e.deducir.filter(x=>x!==n)}
  else if(t.id==='feGuardar')e.guardarCliente=t.checked;
  else if(t.id==='feReserva')e.reservaTotal=t.value;
  else if(t.id==='feIva')e.ivaPct=t.value;
  else if(t.id==='feForma'){e.formaPago=t.value;$('feCuentaBox').hidden=t.value!=='Transferencia'}
  else if(t.id==='feCuenta')e.cuentaId=t.value;
  else if(t.id==='feNotas')e.notas=t.value;
  else if(t.id==='feFechaOp')e.fechaOperacion=t.value;
  else if(t.id==='feMotivo')e.motivo=t.value;
  else if(t.id==='feCobroFecha')e.cobroFecha=t.value;
  feRecalc()});
$('facBox').addEventListener('change',ev=>{if(['feIva','feForma','feCuenta','feGuardar','feFechaOp'].includes(ev.target.id)||ev.target.dataset.ant)$('facBox').dispatchEvent(new Event('input'))});
$('ovFactura').addEventListener('click',e=>{if(e.target.id==='ovFactura')closeFacEd()});

// ───── pestaña Facturas: todas las facturas, filtros y totales de cobro ─────
function facFiltradas(){const s=$('fQ').value.trim().toLowerCase(),tp=$('fTipo').value,cb=$('fCobro').value,de=$('fDesde').value,ha=$('fHasta').value;
  return (DATA.facturas||[]).filter(f=>{const tipo=f.subtipo==='Anticipo'?'Anticipo':f.tipo;
    if(tp&&tipo!==tp)return false;
    if(cb&&!(cobrable(f)&&(f.estadoPago||'Pendiente de pago')===cb))return false;
    if(de&&f.fecha<de)return false;if(ha&&f.fecha>ha)return false;
    if(s){const l=lead(f.leadId);if(![f.numero,f.clienteNombre,f.clienteNif,l&&l.nombre,l&&l.telefono].join(' ').toLowerCase().includes(s))return false}
    return true}).sort((a,b)=>String(b.emitida||b.fecha).localeCompare(String(a.emitida||a.fecha))||b.numero.localeCompare(a.numero))}
function renderFacturas(){
  const fs=DATA.facturas||[],pend=fs.filter(f=>cobrable(f)&&f.estadoPago!=='Pagado'),mes=String(DATA.hoy||'').slice(0,7),anio=String(DATA.hoy||'').slice(0,4);
  const cobMes=fs.filter(f=>cobrable(f)&&f.estadoPago==='Pagado'&&String(f.fechaPago).slice(0,7)===mes);
  const emAnio=fs.filter(f=>f.tipo==='Factura'&&String(f.fecha).slice(0,4)===anio);
  const sum=ls=>ls.reduce((s,f)=>s+toNum(f.total),0);
  $('facCards').innerHTML=[['Pendiente de cobro','--pay-pend',eur(sum(pend)),`${pend.length} ${pend.length===1?'factura':'facturas'} por cobrar`],
    ['Cobrado este mes','--pay-ok',eur(sum(cobMes)),`${cobMes.length} ${cobMes.length===1?'cobro':'cobros'}`],
    ['Facturado en '+anio,'--st-1',eur(sum(emAnio.filter(f=>f.estado==='Emitida'))),`${emAnio.length} facturas emitidas · próxima ${DATA.siguienteFactura||''}`]]
    .map(([t,c,v,s])=>`<div class="scard" style="--sc:var(${c})"><div class="band">${t}</div><div class="body"><b class="fac-sum">${v}</b><small>${esc(s)}</small></div></div>`).join('');
  const ls=facFiltradas();
  $('facBody').innerHTML=ls.map(f=>`<tr class="fac-row ${f.estado==='Anulada'?'anulada':''}" data-act="doc-open" data-n="${esc(f.numero)}" tabindex="0">
    <td><b>${esc(f.numero)}</b></td><td>${esc(docLabel(f))}${f.rectificaA?` <span class="muted-s">de ${esc(f.rectificaA)}</span>`:''}</td>
    <td>${esc(f.clienteNombre)}</td><td>${fdate(f.fecha)}</td><td class="num">${eur(toNum(f.total))}</td><td>${cobroTag(f)}</td></tr>`).join('');
  $('facEmpty').innerHTML=ls.length?'':`<p class="empty">${fs.length?'Ninguna factura coincide con los filtros.':'Aún no hay facturas. Pulsa “Nueva factura” para emitir la primera.'}</p>`;
}
['fQ','fTipo','fCobro','fDesde','fHasta'].forEach(id=>$(id).addEventListener('input',renderFacturas));
$('facBody').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.n)openDoc({numero:e.target.dataset.n})});

// ───── pestaña Configuración (todos): cambios hacia adelante, con motivo y registro ─────
let cuentasEd=[],cfgDirty=false;
function fillConfig(force){
  const cfg=Object.assign({},DATA.config||{},{facturaSiguiente:DATA.siguienteFactura||(DATA.config||{}).facturaSiguiente});
  if(!cfgDirty||force){
    document.querySelectorAll('#cfgForm [data-k]').forEach(i=>{i.value=cfg[i.dataset.k]||''});
    cuentasEd=(DATA.cuentas||[]).map(c=>Object.assign({},c));renderCuentasEd();$('cfgMotivo').value='';cfgDirty=false}
  // Una vez emitida la primera factura del año desde la app, la numeración ya no se toca
  const y=String(DATA.hoy||'').slice(0,4),hay=(DATA.facturas||[]).some(f=>f.tipo==='Factura'&&f.numero.startsWith(y));
  $('cfgSig').readOnly=hay;$('cfgSigHint').textContent=hay?'Avanza sola, sin huecos: ya hay facturas de '+y+' emitidas desde la app.':'Año + 4 cifras. Solo se puede ajustar antes de emitir la primera factura del año.';
  renderCfgHist()}
function renderCuentasEd(){
  $('cfgCuentas').innerHTML=cuentasEd.length?cuentasEd.map((c,i)=>`<div class="cta ${c.activa?'':'off'}">
    <div class="field"><label>IBAN</label><input data-ci="${i}" data-ck="iban" value="${esc(c.iban)}" maxlength="42" placeholder="ES00 0000 0000 0000 0000 0000" autocapitalize="characters" aria-label="IBAN de la cuenta ${i+1}"></div>
    <div class="field"><label>Banco</label><input data-ci="${i}" data-ck="banco" value="${esc(c.banco)}" maxlength="80" placeholder="Ej. Banco Sabadell" aria-label="Banco de la cuenta ${i+1}"></div>
    <div class="field"><label>Titular</label><input data-ci="${i}" data-ck="titular" value="${esc(c.titular)}" maxlength="120" placeholder="A nombre de…" aria-label="Titular de la cuenta ${i+1}"></div>
    <div class="cta-opts"><label class="fe-check"><input type="radio" name="ctaPred" data-ci="${i}" data-ck="predeterminada" ${c.predeterminada?'checked':''} ${c.activa?'':'disabled'}> Predeterminada</label>
      <label class="fe-check"><input type="checkbox" data-ci="${i}" data-ck="activa" ${c.activa?'checked':''}> Activa</label>
      ${c.id?'':`<button type="button" class="mini" data-act="cuenta-del" data-i="${i}">Quitar</button>`}</div></div>`).join('')
    :'<p class="muted-s" style="margin-bottom:10px">Aún no hay ninguna cuenta. Añade la primera.</p>'}
function renderCfgHist(){const h=DATA.configHistorial||[];
  $('cfgHistCount').textContent=h.length?h.length+' cambios':'';
  $('cfgHist').innerHTML=h.map(x=>`<tr><td>${esc(x.fecha)}</td><td>${esc(x.email)}</td><td><b>${esc(x.clave)}</b></td>
    <td class="pre">${esc(x.antes)||'<span class="muted-s">(vacío)</span>'}</td><td class="pre">${esc(x.despues)||'<span class="muted-s">(vacío)</span>'}</td><td>${esc(x.motivo)}</td></tr>`).join('')
    ||'<tr><td colspan="6" class="muted-s">Todavía no hay cambios registrados.</td></tr>'}
$('cfgForm').addEventListener('input',e=>{const t=e.target;if(t.id!=='cfgMotivo')cfgDirty=true;
  if(t.dataset.ci==null)return;const c=cuentasEd[+t.dataset.ci],k=t.dataset.ck;
  if(k==='predeterminada'){cuentasEd.forEach(x=>x.predeterminada=false);c.predeterminada=true}
  else if(k==='activa'){c.activa=t.checked;if(!c.activa)c.predeterminada=false;renderCuentasEd()}
  else c[k]=t.value});
$('cfgForm').addEventListener('change',e=>{if(e.target.dataset.ci!=null&&e.target.type!=='text')$('cfgForm').dispatchEvent(new Event('input'))});
$('cfgForm').addEventListener('submit',async e=>{
  e.preventDefault();const data={},motivo=$('cfgMotivo').value.trim();
  document.querySelectorAll('#cfgForm [data-k]').forEach(i=>data[i.dataset.k]=i.value.trim());
  data.cuentasJson=cuentasEd.map(c=>({id:c.id||'',iban:c.iban,banco:c.banco,titular:c.titular,activa:c.activa!==false,predeterminada:!!c.predeterminada}));
  if(!motivo){toast('Escribe el motivo del cambio: queda en el historial',true);$('cfgMotivo').focus();return}
  $('cfgBtn').setAttribute('aria-busy','true');
  try{const d=await api('saveConfig',data,motivo);cfgDirty=false;setData(d);fillConfig(true);toast('Configuración guardada · las facturas nuevas usarán estos datos')}
  catch(err){}finally{$('cfgBtn').removeAttribute('aria-busy')}
});
async function copyText(txt){
  try{await navigator.clipboard.writeText(txt);return true}catch(e){}
  // Respaldo para navegadores que no permiten el portapapeles dentro de Apps Script
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
  async 'recibo-copy'(){if(!docCur)return;toast(await copyText(docTexto(docCur.d))?'Texto copiado: pégalo donde quieras':'No se pudo copiar automáticamente',!1)},
  'recibo-print'(){document.body.classList.add('print-recibo');window.print();setTimeout(()=>document.body.classList.remove('print-recibo'),500)},
  'doc-open'(el){if($('ovLead').classList.contains('open'))closeLead();openDoc({numero:el.dataset.n})},
  // Editor de facturas
  'fac-new'(){openFacEd({})},
  'fac-close'(){closeFacEd()},
  // Desde la ficha: guarda los cambios del lead y abre el editor con ese cliente ya elegido
  'fac-from-lead'(el){const tipo=el.dataset.tipo;saveLead($('saveBtn'),id=>openFacEd({leadId:id,tipo}))},
  'fe-cli'(el){feElegir(el.dataset.id)},
  'fe-cambiar'(){facEd.leadId='';facEd.q='';renderFacEd();setTimeout(()=>$('feQ').focus(),30)},
  'fe-tipo'(el){facEd.tipo=el.dataset.v;if(facEd.tipo==='Factura')facEd.deducir=anticiposPendientes(facEd.leadId).map(a=>a.numero);
    facEd.cobro=facEd.tipo==='Anticipo'?'Pagado':'Pendiente de pago';renderFacEd()},
  'fe-cobro'(el){facEd.cobro=el.dataset.v;if(!facEd.cobroFecha)facEd.cobroFecha=DATA.hoy;renderFacEd()},
  'fe-mitad'(el){facEd.reservaTotal=(+el.dataset.v).toLocaleString('es-ES',{minimumFractionDigits:2});renderFacEd()},
  // "Etapa y citas" de la ficha: cobrar (o volver a pendiente) la reserva sin salir de la ficha
  async 'res-pago'(el){el.setAttribute('aria-busy','true');const v=el.dataset.v;
    try{setData(await api('setPagoFactura',el.dataset.n,v,DATA.hoy),fichaId);refreshFicha();toast(v==='Pagado'?'Reserva cobrada 💶':'Reserva marcada como pendiente de pago')}
    catch(e){el.removeAttribute('aria-busy')}},
  'fe-line-add'(){if(facEd.lineas.length>=15){toast('Máximo 15 líneas',true);return}facEd.lineas.push({c:'',q:'1',p:''});renderFeLines();feRecalc();
    const ins=$('feLines').querySelectorAll('input[data-k="c"]');ins[ins.length-1].focus()},
  'fe-line-del'(el){facEd.lineas.splice(+el.dataset.i,1);renderFeLines();feRecalc()},
  'fe-ir-config'(){closeFacEd();ACTIONS.nav(document.querySelector('.nav[data-view=config]'))},
  'fe-preview'(){const d=feDoc();hideOv('ovFactura');openDoc({draft:d})},
  'fe-back'(){closeRecibo();if(facEd){renderFacEd();showOv('ovFactura')}},
  async 'doc-emit'(el){if(!docCur||!facEd)return;const {d}=docCur,ant=d.subtipo==='Anticipo',corr=facEd.modo==='corregir';
    const msg=corr?`¿Corregir la factura ${facEd.orig}?\n\nSe emitirá una rectificativa que la anula y la factura nueva n.º ${DATA.siguienteFactura} por ${eur(d.total)}.\n\nMotivo: ${facEd.motivo}`
      :d.tipo==='Factura'?`¿Emitir la FACTURA${ant?' DE RESERVA':''} n.º ${DATA.siguienteFactura} a ${d.clienteNombre} por ${eur(d.total)}?\n\nUna vez emitida no se puede borrar ni modificar: si hubiera un error se corrige con una rectificativa.`
      :`¿Emitir la factura proforma a ${d.clienteNombre} por ${eur(d.total)}?`;
    if(!confirm(msg))return;el.setAttribute('aria-busy','true');
    try{const r=corr?await api('corregirFactura',facEd.orig,fePayload(),facEd.motivo.trim()):await api('emitirDocumento',fePayload());
      setData(r.data,facEd.leadId);facEd=null;openDoc({numero:r.numero});
      toast(corr?`Factura corregida: ${r.numero} (rectificativa ${r.rectificativa})`:(ant?'Reserva ':d.tipo==='Factura'?'Factura ':'Proforma ')+r.numero+' emitida')}
    catch(e){el.removeAttribute('aria-busy')}},
  // Cobro de la factura que se está viendo (con la fecha elegida)
  async 'doc-cobro'(el){if(!docCur)return;const n=docCur.d.numero,v=el.dataset.v,f=v==='Pagado'&&$('cobroFecha')?$('cobroFecha').value:'';
    el.setAttribute('aria-busy','true');
    try{setData(await api('setPagoFactura',n,v,f));openDoc({numero:n});toast(v==='Pagado'?'Cobro registrado 💶':'Marcada como pendiente de pago')}catch(e){el.removeAttribute('aria-busy')}},
  'doc-corregir'(){if(!docCur)return;const n=docCur.d.numero;closeRecibo();openFacEd({corrige:n})},
  async 'doc-anular'(el){if(!docCur)return;const {d}=docCur;
    const motivo=prompt(`Anular la factura ${d.numero}\n\nSe emitirá una FACTURA RECTIFICATIVA (serie R) por el total en negativo. La factura original se conserva marcada como anulada.\n(Si solo hay que cambiar algún dato, usa mejor “Corregir”.)\n\nMotivo de la anulación:`);
    if(motivo===null)return;if(!motivo.trim()){toast('Indica el motivo de la anulación',true);return}
    el.setAttribute('aria-busy','true');
    try{const r=await api('anularFactura',d.numero,motivo.trim());setData(r.data,d.leadId);openDoc({numero:r.numero});toast('Rectificativa '+r.numero+' emitida')}
    catch(e){el.removeAttribute('aria-busy')}},
  // Configuración: cuentas bancarias
  'cuenta-add'(){if(cuentasEd.length>=8){toast('Máximo 8 cuentas',true);return}
    cuentasEd.push({id:'',iban:'',banco:'',titular:'',activa:true,predeterminada:!cuentasEd.some(c=>c.activa&&c.predeterminada)});cfgDirty=true;renderCuentasEd();
    const ins=$('cfgCuentas').querySelectorAll('input[data-ck="iban"]');ins[ins.length-1].focus()},
  'cuenta-del'(el){cuentasEd.splice(+el.dataset.i,1);renderCuentasEd()},
  'cfg-reset'(){cfgDirty=false;fillConfig(true);toast('Cambios descartados')},
  // PDF: en el celular se abre el menú de compartir (WhatsApp, correo…) con el PDF adjunto; si no se puede, se descarga
  async 'doc-pdf'(el){if(!docCur)return;el.setAttribute('aria-busy','true');
    try{const d=docCur.d,blob=await docPdf(d),name=pdfName(d);
      const file=typeof File==='function'?new File([blob],name,{type:'application/pdf'}):null;
      if(file&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});return}catch(e){if(e&&e.name==='AbortError')return}}
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('PDF descargado: adjúntalo en WhatsApp o en el correo')}
    catch(e){toast('No se pudo crear el PDF. Usa “Imprimir” y elige “Guardar como PDF”.',true)}
    finally{el.removeAttribute('aria-busy')}},
  'line-add'(){if(lineasEd.length>=15){toast('Máximo 15 líneas',true);return}lineasEd.push({c:'',q:'1',p:''});renderLineas(false);recalcFact();
    const ins=$('fLines').querySelectorAll('input[data-k="c"]');ins[ins.length-1].focus()},
  'line-del'(el){lineasEd.splice(+el.dataset.i,1);renderLineas(false);recalcFact()},
  'lead-new'(){openLead(null)},
  'lead-save'(el){saveLead(el)},
  'close-lead'(){closeLead()},
  'lead-won'(){if(!confirm('¿Marcar este lead como FACTURADO?\n\nQuedará como “Pendiente de pago” en la pestaña Facturación. Después podrás emitir su factura.'))return;
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
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if($('ovRecibo').classList.contains('open'))closeRecibo();else if($('ovFactura').classList.contains('open'))closeFacEd();else if($('ovCita').classList.contains('open'))closeCita();else if($('ovLead').classList.contains('open'))closeLead();else if(isMobile()&&navOpen())setNav(false)});
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
const ACC_COLOR={'Factura emitida':'--aldia','Factura de anticipo emitida':'--trabajar','Reserva pagada':'--aldia','Reserva pendiente':'--porvencer','Proforma emitida':'--trabajar','Factura rectificativa':'--vencido','Lead eliminado':'--vencido','Lead perdido':'--vencido','Cita cancelada':'--vencido','Usuario actualizado':'--porvencer','Usuario creado':'--porvencer',
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
function bindDrag(box,onDrop,get=lead){
  box.addEventListener('dragstart',e=>{const c=e.target.closest('.kcard');if(!c)return;dragId=c.dataset.id;c.classList.add('dragging');e.dataTransfer.effectAllowed='move'});
  box.addEventListener('dragend',e=>{const c=e.target.closest('.kcard');if(c)c.classList.remove('dragging')});
  box.addEventListener('dragover',e=>{const col=e.target.closest('.col');if(!col)return;e.preventDefault();
    box.querySelectorAll('.col.over').forEach(x=>x!==col&&x.classList.remove('over'));col.classList.add('over')});
  box.addEventListener('dragleave',e=>{const col=e.target.closest('.col');if(col&&!col.contains(e.relatedTarget))col.classList.remove('over')});
  box.addEventListener('drop',e=>{const col=e.target.closest('.col');if(!col||!dragId)return;e.preventDefault();col.classList.remove('over');
    const l=get(dragId);dragId=null;if(l)onDrop(l,col).catch(()=>{})});
}
// Reservas: cambia el estado de cobro de la factura de anticipo
bindDrag($('kanbanReserva'),async(f,col)=>{
  const pago=col.dataset.pago;if((f.estadoPago||'Pendiente de pago')===pago)return;
  const prev=f.estadoPago;f.estadoPago=pago;renderReservas();
  try{setData(await api('setPagoFactura',f.numero,pago));toast('Reserva '+f.numero+(pago==='Pagado'?' cobrada 💶':' pendiente'))}catch(err){f.estadoPago=prev;renderReservas()}
},n=>(DATA.facturas||[]).find(f=>f.numero===n));
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
  if(save)try{localStorage.setItem('crm-theme',t)}catch(e){}
  renderProgress();
}
try{applyTheme(localStorage.getItem('crm-theme')||'dark')}catch(e){applyTheme('dark')}

// ───── sesión (Firebase Auth) ─────
const IDLE_MS=15*60*1000;
const FIREBASE_CONFIG=window.AGRO_CONFIG.firebase;
firebase.initializeApp(FIREBASE_CONFIG);
const auth=firebase.auth();
auth.useDeviceLanguage();
// Persistencia NONE: la sesión vive solo en memoria; al cerrar o recargar la pestaña hay que volver a entrar.
const authReady=auth.setPersistence(firebase.auth.Auth.Persistence.NONE);

let idleTimer=null;
function bumpIdle(){if(document.body.classList.contains('locked'))return;clearTimeout(idleTimer);
  idleTimer=setTimeout(()=>lock('Sesión cerrada por inactividad.'),IDLE_MS)}
['click','keydown','pointermove','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,bumpIdle,{passive:true,capture:true}));

/** Cierra sesión y borra de la pantalla y de la memoria todos los datos del CRM. */
function lock(msg,ok){
  clearTimeout(idleTimer);
  closeCita();closeLead();
  DATA={hoy:iso(T),leads:[],citas:[],historial:[],movimientos:[],config:{}};
  hideOv('ovRecibo');$('reciboBox').innerHTML='';hideOv('ovFactura');$('facBox').innerHTML='';facEd=null;cfgDirty=false;
  $('q').value='';q='';filtro='todos';tfiltro='';
  renderAll();
  ['ficha','citaBox','usersBody','auditBody'].forEach(id=>$(id).innerHTML='');
  ['userEmail','userName','userRole','meAvatar'].forEach(id=>$(id).textContent='');
  $('greet').textContent='Hola 👋';
  ADMIN=null;document.body.classList.remove('is-admin','nav-open');$('userForm').reset();
  $('aQ').value='';['aUser','aAccion'].forEach(id=>$(id).innerHTML='<option value=""></option>');
  document.body.classList.add('locked');
  $('lPass').value='';setPassVisible(false);
  loginMsg(msg||'',ok);
  auth.signOut().catch(()=>{});
}
function loginMsg(m,ok){$('lMsg').textContent=m;$('lMsg').classList.toggle('ok',!!ok)}
function shakeLogin(){const c=$('loginForm');c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake')}
async function unlock(){
  try{
    setData(await api('iniciarSesion'));
    document.body.classList.remove('locked');
    loginMsg('');bumpIdle();
    ACTIONS.nav(document.querySelector('.nav[data-view=dashboard]'));
  }catch(e){/* api() ya bloquea y muestra el motivo */}
}

// Mostrar / ocultar contraseña. Se vuelve a ocultar al enviar y al cerrar sesión.
const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.1 9.1 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M2 2l20 20"/></svg>';
function setPassVisible(on){
  $('lPass').type=on?'text':'password';
  $('lEye').innerHTML=on?EYE_OFF:EYE;
  $('lEye').setAttribute('aria-pressed',String(on));
  $('lEye').setAttribute('aria-label',on?'Ocultar contraseña':'Mostrar contraseña');
}
$('lEye').addEventListener('click',()=>{const inp=$('lPass'),pos=inp.selectionStart;
  setPassVisible(inp.type==='password');inp.focus();try{inp.setSelectionRange(pos,pos)}catch(e){}});
setPassVisible(false);

const LOGIN_ERR={
  'auth/too-many-requests':'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed':'Sin conexión. Revisa tu internet.',
  'auth/user-disabled':'Esta cuenta está deshabilitada.',
};
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('lEmail').value.trim(),pass=$('lPass').value;
  if(!email||!pass){loginMsg('Escribe tu email y contraseña.');shakeLogin();return}
  setPassVisible(false);
  $('lBtn').setAttribute('aria-busy','true');loginMsg('');bootOn();
  try{
    await authReady;
    await auth.signInWithEmailAndPassword(email,pass);
    $('lPass').value='';
    await unlock();
  }catch(err){
    // Mensaje genérico: no revela si el email existe o si falló la contraseña.
    loginMsg(LOGIN_ERR[err&&err.code]||'Email o contraseña incorrectos.');shakeLogin();
  }finally{$('lBtn').removeAttribute('aria-busy');bootOff()}
});
$('lReset').addEventListener('click',async()=>{
  const email=$('lEmail').value.trim();
  if(!email){loginMsg('Escribe tu email arriba y pulsa de nuevo.');return}
  try{await auth.sendPasswordResetEmail(email)}catch(e){}
  loginMsg('Si el email está registrado, recibirás un enlace para cambiar la contraseña.',true);
});
auth.onAuthStateChanged(u=>{if(!u&&!document.body.classList.contains('locked'))lock('Tu sesión ha terminado. Vuelve a entrar.')});

// ───── arranque ─────
renderAll();
setTimeout(()=>$('lEmail').focus(),100);
