/* Yakbal · demo
 * "Servidor" simulado en memoria con datos ficticios. Reproduce las reglas de la app real
 * (fechas de cada etapa, movimientos, estado de pago, numeración de recibos, auditoría).
 * Nada se envía ni se guarda: al recargar la página la demo vuelve a empezar.
 */
const DemoBackend = (() => {
  const STAGES = ['Nuevo', 'Contactado', 'Seguimiento', 'Presupuesto enviado', 'Reservado', 'Facturado', 'Perdido'];
  const STAGE_COL = { 'Contactado': 'fechaContactado', 'Seguimiento': 'fechaSeguimiento', 'Presupuesto enviado': 'fechaPresupuesto',
    'Reservado': 'fechaReservado', 'Facturado': 'fechaFacturado', 'Perdido': 'fechaPerdido' };
  const USOS = ['Agua', 'Purín', 'Abono'];
  const TEMPS = ['Caliente', 'Templado', 'Frío', 'Descartado'];
  const ORIGENES = ['Meta Ads', 'Meta Ads', 'Meta Ads', 'Teléfono', 'Recomendación', 'Otro'];
  const TIPOS = ['Llamada', 'Mensaje', 'Correo', 'Instalación', 'Enviar presupuesto', 'Enviar factura'];
  const MOTIVOS = ['Precio', 'Compró a otro proveedor', 'No tiene espacio', 'No responde', 'Ya no lo necesita'];
  const FORMAS = ['Transferencia', 'Tarjeta', 'Efectivo', 'Financiación'];
  const ME = { uid: 'u1', email: 'ana@demo.yakbal', nombre: 'Ana Morales', rol: 'admin' };

  let S = null, lang = 'es', seq = 1;

  // ── utilidades de fecha (todo relativo a HOY para que la demo siempre parezca reciente)
  const p2 = n => String(n).padStart(2, '0');
  const isoD = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const stamp = (d, h, m) => isoD(d) + ' ' + p2(h) + ':' + p2(m);
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const daysAgo = n => { const d = today0(); d.setDate(d.getDate() - n); return d; };
  const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }; // fecha local, no UTC
  const nowStamp = () => { const d = new Date(); return stamp(d, d.getHours(), d.getMinutes()); };
  const nowSec = () => { const d = new Date(); return nowStamp() + ':' + p2(d.getSeconds()); };
  const id = () => 'd' + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
  // Aleatorio reproducible: la demo es igual para todos los visitantes
  let rs = 7;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const clone = o => JSON.parse(JSON.stringify(o));

  const NAMES = ['Granja San José', 'Agropecuaria El Roble', 'Finca La Esperanza', 'Cooperativa Los Altos', 'Hacienda Santa Clara',
    'María Fernanda López', 'Carlos Méndez', 'Lucía Herrera', 'Granja Las Palmas', 'Rancho El Mirador', 'Jorge Castillo',
    'Sofía Ramírez', 'Lácteos del Norte', 'Finca El Encino', 'Pedro Alvarado', 'Ana Lucía Pineda', 'Agrícola Santa Fe',
    'Diego Morales', 'Granja Avícola Sol', 'Valeria Ortiz', 'Hacienda El Prado', 'Roberto Juárez', 'Finca Monte Verde',
    'Camila Torres', 'Porcina La Unión', 'Andrés Solís', 'Granja Tres Ríos', 'Natalia Cruz', 'Agroindustrias Delta',
    'Luis Fernando Ruiz', 'Finca Buena Vista', 'Gabriela Mejía', 'Ganadera San Miguel', 'Martín Rosales', 'Finca Los Pinos',
    'Isabel Guzmán', 'Granja El Retiro', 'Ricardo Paz', 'Cooperativa Nuevo Día', 'Elena Castro', 'Finca Santa Rita',
    'Tomás Aguilar', 'Hortícola Valle Alto', 'Paula Reyes', 'Granja La Fortuna', 'Fernando Ochoa', 'Finca El Cedro',
    'Daniela Vargas', 'Rancho Las Flores', 'Héctor Navarro', 'Lechería San Pablo', 'Adriana Fuentes', 'Finca La Ceiba',
    'Óscar Lemus', 'Granja Altamira', 'Marcela Ríos'];

  const T = {
    es: {
      empresa: 'Depósitos del Valle', doc: 'NIT', tax: 'IVA', iva: '12.00', moneda: 'USD', pref: '502', pie: 'Gracias por su confianza.',
      dir: 'Km 14 Carretera al Pacífico, Bodega 3', concept: (u, c) => `Depósito de ${c} para ${u.toLowerCase()}, instalación incluida`,
      notes: ['Vio el anuncio en Facebook, quiere cotización.', 'Pide medidas del terreno antes de decidir.', 'Interesado, comparar con su proveedor actual.',
        'Quiere instalación antes de la temporada de lluvias.', 'Enviar fotos de instalaciones anteriores.', 'Prefiere que lo llamen por la tarde.'],
      espacio: ['Sí, junto al establo', 'Sí, terreno nivelado', 'Por confirmar', 'Sí, 20 × 15 m', 'Necesita preparar el terreno'],
      cuando: ['Este mes', 'Antes de la temporada de lluvias', 'En 2 a 3 meses', 'Urgente', 'Próximo trimestre'],
    },
    en: {
      empresa: 'Valley Tanks Co.', doc: 'Tax ID', tax: 'Tax', iva: '8.00', moneda: 'USD', pref: '', pie: 'Thank you for your business.',
      dir: '1450 Farm Road 9, Unit 3', concept: (u, c) => `${c} ${({ Agua: 'water', 'Purín': 'slurry', Abono: 'fertilizer' })[u]} tank, installation included`,
      notes: ['Saw the Facebook ad, wants a quote.', 'Asked for site measurements before deciding.', 'Interested, comparing with current supplier.',
        'Wants installation before the rainy season.', 'Send photos of previous installations.', 'Prefers calls in the afternoon.'],
      espacio: ['Yes, next to the barn', 'Yes, level ground', 'To be confirmed', 'Yes, 65 × 50 ft', 'Needs site preparation'],
      cuando: ['This month', 'Before the rainy season', 'In 2–3 months', 'Urgent', 'Next quarter'],
    },
  };
  const phone = i => lang === 'en'
    ? `+1 555 ${200 + i} ${String(1000 + i * 37).slice(-4)}`
    : `${pick(['5', '4', '3'])}${String(1000 + i * 73).slice(-3)} ${String(2000 + i * 191).slice(-4)}`;

  // ── registro de acciones
  function log(leadId, nombre, accion, texto, who, when) {
    const w = who || ME, f = when || nowStamp();
    S.historial.push({ id: id(), leadId, fecha: f, texto, usuario: w.email });
    S.auditoria.push({ id: id(), fecha: f.length > 16 ? f : f + ':00', email: w.email, accion, detalle: nombre + ' · ' + texto, leadId });
  }
  function audit(accion, detalle, leadId) {
    S.auditoria.push({ id: id(), fecha: nowSec(), email: ME.email, accion, detalle, leadId: leadId || '' });
  }
  function nextReceipt(year) {
    const pre = (S.config.serieRecibo || 'R') + '-' + (year || today0().getFullYear()) + '-';
    let max = 0;
    S.leads.forEach(l => { if ((l.factNumero || '').indexOf(pre) === 0) max = Math.max(max, Number(l.factNumero.slice(pre.length)) || 0); });
    return pre + String(max + 1).padStart(4, '0');
  }

  // ── generación de la empresa ficticia
  function init(lg) {
    lang = lg === 'en' ? 'en' : 'es'; seq = 1; rs = 7;
    const L = T[lang];
    S = { leads: [], citas: [], historial: [], movimientos: [], auditoria: [], usuarios: [], config: {
      empresaNombre: L.empresa, empresaNif: lang === 'en' ? '84-2211903' : '9876543-2', empresaDireccion: L.dir,
      empresaTelefono: lang === 'en' ? '+1 555 010 2030' : '2233 4455', empresaEmail: lang === 'en' ? 'hello@valleytanks.demo' : 'hola@depositosdelvalle.demo',
      ivaDefecto: L.iva, serieRecibo: 'R', pieRecibo: L.pie, moneda: L.moneda, impuestoNombre: L.tax, docFiscal: L.doc, prefijoTel: L.pref } };
    const team = [ME, { uid: 'u2', email: 'luis@demo.yakbal', nombre: 'Luis Pérez', rol: 'usuario' }, { uid: 'u3', email: 'marta@demo.yakbal', nombre: 'Marta Ríos', rol: 'usuario' }];
    S.usuarios = [
      { uid: 'u1', email: ME.email, nombre: ME.nombre, rol: 'admin', activo: '1', creado: stamp(daysAgo(120), 9, 0), creadoPor: 'Propiedades del script', ultimoAcceso: nowStamp(), principal: true },
      { uid: 'u2', email: 'luis@demo.yakbal', nombre: 'Luis Pérez', rol: 'usuario', activo: '1', creado: stamp(daysAgo(90), 10, 12), creadoPor: ME.email, ultimoAcceso: stamp(daysAgo(0), 8, 41) },
      { uid: 'u3', email: 'marta@demo.yakbal', nombre: 'Marta Ríos', rol: 'usuario', activo: '1', creado: stamp(daysAgo(60), 11, 5), creadoPor: ME.email, ultimoAcceso: stamp(daysAgo(1), 17, 20) },
      { uid: 'pendiente-x1', email: 'jorge@demo.yakbal', nombre: 'Jorge Lemus', rol: 'usuario', activo: '1', creado: stamp(daysAgo(2), 12, 0), creadoPor: ME.email, ultimoAcceso: '' },
    ];

    // Plan de etapas: [etapa final, cuántos] — pensado para que el tablero y los gráficos se vean vivos
    const plan = [['Facturado', 14], ['Perdido', 6], ['Reservado', 4], ['Presupuesto enviado', 6], ['Seguimiento', 7], ['Contactado', 8], ['Nuevo', 9]];
    let n = 0;
    plan.forEach(([final, count]) => {
      for (let k = 0; k < count; k++, n++) {
        const nombre = NAMES[n % NAMES.length], uso = USOS[n % 3], cap = pick(['150 m³', '250 m³', '300 m³', '500 m³', '800 m³', '1.000 m³']);
        const closed = final === 'Facturado' || final === 'Perdido';
        // Antigüedad: los cerrados se reparten en ~12 semanas; los abiertos son más recientes
        const age = closed ? 10 + Math.floor(rnd() * 75) : Math.floor(rnd() * (final === 'Nuevo' ? 6 : 28)) + (final === 'Nuevo' ? 0 : 3);
        const ingreso = daysAgo(age), who = pick(team);
        const l = { id: id(), fechaIngreso: isoD(ingreso), nombre, telefono: phone(n), email: nombre.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().split(' ').slice(0, 2).join('.') + '@mail.demo',
          uso, etapa: 'Nuevo', capacidad: cap, espacio: pick(L.espacio), cuando: pick(L.cuando), precio: '', origen: pick(ORIGENES),
          actualizado: stamp(ingreso, 9, 0), actualizadoPor: who.email, fechaFacturado: '', fechaContactado: '', fechaSeguimiento: '', fechaPresupuesto: '',
          fechaReservado: '', fechaPerdido: '', motivoPerdida: '', temperatura: '', estadoPago: '', fechaPagado: '',
          factNombre: '', factNif: '', factEmail: '', factDireccion: '', factCP: '', factPoblacion: '', factProvincia: '', factConcepto: '', factImporte: '', factIva: '', factFormaPago: '', factNumero: '', factFecha: '' };
        S.leads.push(l);
        S.movimientos.push({ id: id(), leadId: l.id, fecha: stamp(ingreso, 9, 5), de: '', a: 'Nuevo', email: who.email });
        log(l.id, nombre, 'Lead creado', 'Lead creado (' + l.origen + ')', who, stamp(ingreso, 9, 5));
        if (rnd() < 0.7) log(l.id, nombre, 'Nota añadida', pick(L.notes), who, stamp(ingreso, 9, 20));
        // Recorrido por las etapas hasta la final, con fechas crecientes
        const path = final === 'Perdido' ? STAGES.slice(1, 1 + Math.floor(rnd() * 3)).concat(['Perdido']) : STAGES.slice(1, STAGES.indexOf(final) + 1);
        let d = new Date(ingreso), prev = 'Nuevo';
        // Los cerrados tardaron entre 1 y 5 semanas en cerrarse (así las ventas se reparten en el tiempo)
        // …salvo las 3 primeras ventas, que se cierran esta semana (el tablero muestra actividad reciente)
        const span = final === 'Facturado' && k < 3 ? age : closed ? Math.max(1, Math.min(age, 7 + Math.floor(rnd() * 28))) : Math.max(1, age);
        path.forEach((st, i) => {
          d = new Date(ingreso); d.setDate(d.getDate() + Math.round(span * (i + 1) / (path.length + (closed ? 0 : 1))));
          if (d > today0()) d = today0();
          const ts = stamp(d, 9 + (i % 8), (i * 13) % 60);
          S.movimientos.push({ id: id(), leadId: l.id, fecha: ts, de: prev, a: st, email: who.email });
          if (STAGE_COL[st]) l[STAGE_COL[st]] = ts;
          log(l.id, nombre, st === 'Perdido' ? 'Lead perdido' : st === 'Facturado' ? 'Lead facturado' : 'Etapa cambiada', 'Etapa: ' + prev + ' → ' + st, who, ts);
          prev = st; l.etapa = st; l.actualizado = ts;
        });
        // Temperatura según lo avanzado
        l.temperatura = final === 'Perdido' ? 'Descartado' : ['Reservado', 'Presupuesto enviado', 'Facturado'].includes(final) ? pick(['Caliente', 'Caliente', 'Templado'])
          : pick(['Templado', 'Frío', 'Caliente', '', 'Templado']);
        if (final === 'Perdido') { l.motivoPerdida = pick(MOTIVOS); }
        if (['Presupuesto enviado', 'Reservado', 'Facturado'].includes(final)) {
          const base = (Math.round((1800 + rnd() * 9000) / 50) * 50);
          Object.assign(l, { precio: '', factNombre: nombre.indexOf(' ') > 0 && /^(Granja|Finca|Hacienda|Cooperativa|Rancho|Agro|Lácteos|Porcina|Ganadera|Lechería|Hortícola|Agrícola)/.test(nombre) ? nombre + (lang === 'en' ? ' LLC' : ', S.A.') : nombre,
            factNif: lang === 'en' ? '7' + String(1000000 + n * 7919).slice(-7) : String(1000000 + n * 7919).slice(-7) + '-' + (n % 9),
            factEmail: l.email, factDireccion: lang === 'en' ? `${100 + n * 11} County Road ${n % 40}` : `Km ${10 + n % 60} Carretera ${pick(['al Atlántico', 'Interamericana', 'al Pacífico'])}`,
            factCP: lang === 'en' ? String(70100 + n * 13) : String(1000 + n * 17).slice(-5), factPoblacion: lang === 'en' ? pick(['Fresno', 'Modesto', 'Salinas', 'Visalia']) : pick(['Escuintla', 'Chimaltenango', 'Zacapa', 'Jutiapa', 'Cobán']),
            factProvincia: lang === 'en' ? 'CA' : '', factConcepto: L.concept(uso, cap), factImporte: base.toFixed(2), factFormaPago: pick(FORMAS) });
        }
        if (final === 'Facturado') {
          const fy = (l.fechaFacturado || '').slice(0, 4);
          l.factNumero = nextReceipt(fy); l.factFecha = (l.fechaFacturado || '').slice(0, 10);
          const paid = k < 9; // la mayoría ya cobrados
          l.estadoPago = paid ? 'Pagado' : 'Pendiente de pago';
          if (paid) {
            const pdD = parseD(l.fechaFacturado); pdD.setDate(pdD.getDate() + 2 + Math.floor(rnd() * 9));
            if (pdD > today0()) pdD.setTime(today0().getTime());
            l.fechaPagado = stamp(pdD, 11, 30);
            log(l.id, nombre, 'Pago registrado', 'Pago: Pendiente de pago → Pagado', who, l.fechaPagado);
          }
        }
      }
    });

    // Citas: algunas vencidas, varias hoy (dos solapadas), mañana, esta semana y la próxima
    const open = S.leads.filter(l => !['Facturado', 'Perdido'].includes(l.etapa));
    const slots = [[-3, '10:00', 30], [-1, '16:00', 30], [0, '09:00', 30], [0, '09:15', 60], [0, '11:30', 30], [0, '15:00', 45], [0, '17:30', 30],
      [1, '10:00', 30], [1, '12:00', 90], [1, '16:30', 30], [2, '09:30', 30], [2, '13:00', 120], [3, '10:30', 45], [3, '15:00', 30], [4, '11:00', 30],
      [5, '09:00', 60], [7, '10:00', 30], [8, '12:30', 30], [9, '16:00', 45], [11, '10:00', 30], [13, '09:30', 60]];
    slots.forEach((s, i) => {
      const l = open[(i * 5) % open.length], d = daysAgo(-s[0]);
      const tipo = l.etapa === 'Reservado' ? pick(['Instalación', 'Llamada']) : l.etapa === 'Presupuesto enviado' ? pick(['Llamada', 'Enviar presupuesto', 'Mensaje']) : pick(['Llamada', 'Mensaje', 'Correo', 'Llamada']);
      S.citas.push({ id: id(), leadId: l.id, fecha: isoD(d), hora: s[1], tipo, nota: '', hecha: false, creada: stamp(daysAgo(Math.max(1, -s[0] + 2)), 9, 0), creadaPor: pick(team).email, hechaEl: '', duracion: String(s[2]) });
    });
    // Citas ya realizadas en las últimas semanas (gráfico "Citas")
    for (let i = 0; i < 46; i++) {
      const l = S.leads[(i * 7) % S.leads.length], back = 1 + Math.floor(rnd() * 80), d = daysAgo(back);
      if (d < parseD(l.fechaIngreso)) continue;
      S.citas.push({ id: id(), leadId: l.id, fecha: isoD(d), hora: pick(['09:00', '10:30', '12:00', '15:00', '16:30']), tipo: pick(TIPOS), nota: '', hecha: true,
        creada: stamp(d, 8, 0), creadaPor: pick(team).email, hechaEl: stamp(d, 17, 0), duracion: '30' });
    }
    // Registro: inicios de sesión recientes
    team.forEach((u, i) => [0, 1, 2, 4].forEach(dd => S.auditoria.push({ id: id(), fecha: stamp(daysAgo(dd), 8 + i, 5 + dd) + ':00', email: u.email, accion: 'Inicio de sesión', detalle: '', leadId: '' })));
    S.auditoria.sort((a, b) => a.fecha.localeCompare(b.fecha));
    S.historial.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  // ── reglas (como en el servidor real)
  const find = lid => S.leads.find(l => l.id === lid);
  const fail = m => new Error(m);
  function stageMove(l, de, a, motivo) {
    const ts = nowStamp();
    S.movimientos.push({ id: id(), leadId: l.id, fecha: ts, de, a, email: ME.email });
    if (STAGE_COL[a]) l[STAGE_COL[a]] = ts;
    l.motivoPerdida = a === 'Perdido' ? String(motivo || '').slice(0, 300) : '';
    log(l.id, l.nombre, a === 'Perdido' ? 'Lead perdido' : a === 'Facturado' ? 'Lead facturado' : 'Etapa cambiada',
      'Etapa: ' + de + ' → ' + a + (a === 'Perdido' && l.motivoPerdida ? ' · motivo: ' + l.motivoPerdida : ''));
  }
  function payPatch(l, etapa, pedido, prevEtapa, prevPago) {
    if (etapa !== 'Facturado') { l.estadoPago = ''; l.fechaPagado = ''; return; }
    if (!l.factNumero) { l.factNumero = nextReceipt(); l.factFecha = isoD(today0()); log(l.id, l.nombre, 'Recibo emitido', 'Recibo ' + l.factNumero); }
    const antes = prevEtapa === 'Facturado' ? (prevPago || 'Pendiente de pago') : '';
    const pago = ['Pendiente de pago', 'Pagado'].includes(pedido) ? pedido : (antes || 'Pendiente de pago');
    if (pago !== antes && (antes || pago === 'Pagado')) log(l.id, l.nombre, pago === 'Pagado' ? 'Pago registrado' : 'Pago pendiente', 'Pago: ' + (antes || 'Facturado') + ' → ' + pago);
    l.fechaPagado = pago === 'Pagado' ? (antes === 'Pagado' && l.fechaPagado ? l.fechaPagado : nowStamp()) : '';
    l.estadoPago = pago;
  }
  const money = (v, label) => {
    let s = String(v || '').replace(/[^\d.,]/g, ''); if (!s) return '';
    if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) throw fail(label + ' no es un número válido');
    return Number(s).toFixed(2);
  };
  const FIELDS = ['nombre', 'telefono', 'email', 'uso', 'etapa', 'capacidad', 'espacio', 'cuando', 'precio', 'origen', 'temperatura',
    'factNombre', 'factNif', 'factEmail', 'factDireccion', 'factCP', 'factPoblacion', 'factProvincia', 'factConcepto', 'factFormaPago'];

  function data() { return { hoy: isoD(today0()), yo: ME, leads: S.leads, citas: S.citas, historial: S.historial, movimientos: S.movimientos, config: S.config }; }

  return {
    init,
    featured(kind) {
      if (kind === 'recibo') return (S.leads.find(l => l.etapa === 'Facturado' && l.estadoPago === 'Pagado') || {}).id;
      return (S.leads.find(l => l.etapa === 'Reservado' && S.citas.some(c => c.leadId === l.id && !c.hecha)) || S.leads.find(l => l.etapa === 'Reservado') || {}).id;
    },
    iniciarSesion() { audit('Inicio de sesión', ''); return data(); },
    getData: data,
    saveLead(input) {
      if (!String(input.nombre || '').trim()) throw fail('El nombre es obligatorio');
      const nota = String(input.nota || '').trim();
      const etapa = STAGES.includes(input.etapa) ? input.etapa : 'Nuevo';
      if (etapa === 'Perdido' && !String(input.motivoPerdida || '').trim()) throw fail('Indica por qué no se ganó el lead');
      const imp = money(input.factImporte, 'El importe'), iva = money(input.factIva, 'El IVA');
      let l;
      if (!input.id) {
        l = { id: id(), fechaIngreso: isoD(today0()), etapa: 'Nuevo', estadoPago: '', fechaPagado: '', factNumero: '', factFecha: '' };
        FIELDS.forEach(f => { if (f !== 'etapa') l[f] = String(input[f] || '').trim(); });
        Object.assign(l, { factImporte: imp, factIva: iva, actualizado: nowStamp(), actualizadoPor: ME.email });
        S.leads.push(l);
        log(l.id, l.nombre, 'Lead creado', 'Lead creado (' + (l.origen || 'Meta Ads') + ')');
        S.movimientos.push({ id: id(), leadId: l.id, fecha: nowStamp(), de: '', a: 'Nuevo', email: ME.email });
        if (etapa !== 'Nuevo') { stageMove(l, 'Nuevo', etapa, input.motivoPerdida); l.etapa = etapa; }
        payPatch(l, etapa, input.estadoPago, '', '');
      } else {
        l = find(input.id); if (!l) throw fail('No se encontró el registro');
        const prevEtapa = l.etapa, prevPago = l.estadoPago, changed = [];
        FIELDS.forEach(f => { if (f === 'etapa') return; const v = String(input[f] || '').trim(); if (String(l[f] || '') !== v) changed.push(f); l[f] = v; });
        if (String(l.factImporte || '') !== imp) changed.push('factImporte'); l.factImporte = imp;
        if (String(l.factIva || '') !== iva) changed.push('factIva'); l.factIva = iva;
        if (changed.length) audit('Lead editado', l.nombre + ' · cambió: ' + changed.join(', '), l.id);
        if (prevEtapa !== etapa) { stageMove(l, prevEtapa, etapa, input.motivoPerdida); l.etapa = etapa; }
        else if (etapa === 'Perdido') l.motivoPerdida = String(input.motivoPerdida || '');
        payPatch(l, etapa, input.estadoPago, prevEtapa, prevPago);
        l.actualizado = nowStamp(); l.actualizadoPor = ME.email;
      }
      if (nota) log(l.id, l.nombre, 'Nota añadida', nota);
      return { id: l.id, data: data() };
    },
    setEtapa(lid, etapa) {
      const l = find(lid); if (!l) throw fail('No se encontró el registro');
      if (l.etapa !== etapa) { const pe = l.etapa, pp = l.estadoPago; stageMove(l, pe, etapa, ''); l.etapa = etapa; payPatch(l, etapa, undefined, pe, pp); }
      return data();
    },
    setPago(lid, estado) {
      const l = find(lid); if (!l || l.etapa !== 'Facturado') throw fail('Solo los leads facturados tienen estado de pago');
      if (l.estadoPago !== estado) payPatch(l, 'Facturado', estado, 'Facturado', l.estadoPago);
      return data();
    },
    deleteLead(lid) {
      const l = find(lid); if (!l) throw fail('No se encontró el registro');
      S.leads = S.leads.filter(x => x.id !== lid); S.citas = S.citas.filter(c => c.leadId !== lid);
      S.historial = S.historial.filter(h => h.leadId !== lid); S.movimientos = S.movimientos.filter(m => m.leadId !== lid);
      audit('Lead eliminado', l.nombre + ' · etapa ' + l.etapa, lid);
      return data();
    },
    addCita(c) {
      const l = find(c.leadId); if (!l) throw fail('El lead no existe');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha || '')) throw fail('Fecha no válida');
      S.citas.push({ id: id(), leadId: l.id, fecha: c.fecha, hora: c.hora || '', tipo: TIPOS.includes(c.tipo) ? c.tipo : 'Llamada', nota: String(c.nota || ''),
        hecha: false, creada: nowStamp(), creadaPor: ME.email, hechaEl: '', duracion: String(c.duracion || '30') });
      log(l.id, l.nombre, 'Cita agendada', 'Cita agendada: ' + c.tipo + ' el ' + c.fecha + (c.hora ? ' ' + c.hora : ''));
      return data();
    },
    setCitaHecha(cid) {
      const c = S.citas.find(x => x.id === cid); if (!c) throw fail('No se encontró el registro');
      c.hecha = true; c.hechaEl = nowStamp(); const l = find(c.leadId);
      log(c.leadId, l ? l.nombre : '', 'Cita realizada', 'Cita realizada: ' + c.tipo + ' del ' + c.fecha);
      return data();
    },
    deleteCita(cid) {
      const c = S.citas.find(x => x.id === cid); if (!c) throw fail('No se encontró el registro');
      S.citas = S.citas.filter(x => x.id !== cid); const l = find(c.leadId);
      log(c.leadId, l ? l.nombre : '', 'Cita cancelada', 'Cita cancelada: ' + c.tipo + ' del ' + c.fecha);
      return data();
    },
    addNota(lid, texto) {
      const l = find(lid); if (!l) throw fail('El lead no existe');
      if (!String(texto || '').trim()) throw fail('La nota está vacía');
      log(lid, l.nombre, 'Nota añadida', String(texto).trim());
      return data();
    },
    adminData() { return { usuarios: S.usuarios, auditoria: S.auditoria.slice(-1500).reverse(), totalAuditoria: S.auditoria.length }; },
    createUser(u) {
      const email = String(u.email || '').trim().toLowerCase();
      if (!String(u.nombre || '').trim()) throw fail('El nombre es obligatorio');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('El email no es válido');
      if (S.usuarios.some(x => x.email === email)) throw fail('Esa persona ya está en la lista de usuarios. Si está desactivada, reactívala.');
      S.usuarios.push({ uid: id(), email, nombre: u.nombre.trim(), rol: u.rol === 'admin' ? 'admin' : 'usuario', activo: '1', creado: nowStamp(), creadoPor: ME.email, ultimoAcceso: '' });
      audit('Usuario creado', u.nombre + ' <' + email + '> como ' + (u.rol || 'usuario'));
      return { nuevo: true, enviado: true, admin: this.adminData() };
    },
    updateUser(uid, ch) {
      const u = S.usuarios.find(x => x.uid === uid); if (!u || u.principal) throw fail('No se puede modificar este usuario');
      if (ch.rol) u.rol = ch.rol; if (ch.activo !== undefined) u.activo = ch.activo ? '1' : '0';
      audit('Usuario actualizado', u.nombre + ' <' + u.email + '>');
      return this.adminData();
    },
    sendPasswordReset() { audit('Email de contraseña enviado', '(demo)'); return true; },
    saveConfig(cfg) { Object.keys(cfg).forEach(k => { if (k in S.config) S.config[k] = String(cfg[k]); }); audit('Datos de empresa actualizados', 'Cambió: ' + Object.keys(cfg).join(', ')); return data(); },
  };
})();
