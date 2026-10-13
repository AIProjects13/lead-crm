/* Yakbal · página-anuncio: idioma ES/EN, capturas, WhatsApp, animaciones, galería y demo. */
(function () {
  document.documentElement.classList.add('js');
  const WA = '50258253416';

  // ── Textos en inglés (el español está escrito en el HTML)
  const EN = {
    'meta.desc': 'Yakbal takes every customer from first contact to final payment: workflow, scheduling, receipts and collections, on desktop and mobile.',
    'skip': 'Skip to content', 'nav.aria': 'Main',
    'nav.features': 'Features', 'nav.gallery': 'Gallery', 'nav.demo': 'Demo', 'nav.editions': 'Editions', 'nav.faq': 'FAQ',
    'cta.demo': 'Get a demo', 'cta.try': 'Try it now', 'cta.whatsapp': 'Get a quote on WhatsApp', 'cta.whatsapp2': 'Message us on WhatsApp',
    'hero.eyebrow': 'New · Sales & collections system',
    'hero.title': 'From first contact to final payment. <em>All safeguarded.</em>',
    'hero.sub': 'Yakbal guides every customer through your sales process: add them, follow them stage by stage, schedule every call, issue the receipt and track the payment. On your computer and your phone.',
    'hero.maya': 'means “to safeguard” in the Mayan language.',
    'specs.title': 'Spec sheet', 'specs.stages': 'sales stages, from “New” to “Invoiced”', 'specs.views': 'calendar views: month, week and day',
    'specs.receipt': 'click to issue and share the receipt', 'specs.status': 'colors that tell you what is urgent', 'specs.themes': 'themes: light and dark',
    'specs.session': 'and the session closes itself when idle', 'specs.mobile': 'fully functional on mobile', 'specs.lang': 'and in your country’s currency',
    'feat.kicker': 'Standard equipment', 'feat.title': 'Everything you need to sell more and get paid on time.',
    'f1.tag': 'Workflow', 'f1.title': 'Every customer, in their stage.',
    'f1.text': 'Drag the customer’s card from one stage to the next. Yakbal records the date of every step, so you know how long each one takes and where sales get stuck.',
    'f1.b1': 'Color-coded stages with weekly counters', 'f1.b2': 'Days each customer has spent in their stage', 'f1.b3': 'A reason is required when a sale is lost',
    'f2.tag': 'Scheduling', 'f2.title': 'Never forget a call again.',
    'f2.text': 'Schedule calls, messages, installations or sending an invoice. Tap a free slot and the appointment is created. Overdue items turn red and today’s show up on your dashboard.',
    'f2.b1': 'Month, week and day views', 'f2.b2': 'Appointments with duration, never overlapping', 'f2.b3': 'One click on an appointment opens the customer record',
    'f3.tag': 'Customer record', 'f3.title': 'The whole story, in one record.',
    'f3.text': 'Contact details, what they need, when they need it, their appointments, notes and the timeline of their purchase. Tag every customer as hot, warm or cold and focus on the ones who will buy.',
    'f3.b1': 'Questions tailored to your business', 'f3.b2': 'Dated notes from every call', 'f3.b3': 'Billing details from day one',
    'f4.tag': 'Billing & collections', 'f4.title': 'Invoice, share and get paid.',
    'f4.text': 'When you close the sale, Yakbal numbers the receipt automatically. Send it by WhatsApp or email in one tap and keep track of what is pending and what is paid.',
    'f4.b1': 'Receipts with your logo, details and tax', 'f4.b2': 'Pending and paid, with payment date', 'f4.b3': 'In your country’s currency',
    'f5.tag': 'Dashboard', 'f5.title': 'Decide with numbers, not hunches.',
    'f5.text': 'New customers, sales, payments and appointments by week, by month and by day of the week, compared with your average. What is urgent is right there when you log in.',
    'f5.b1': 'Overdue, due soon, to work on and on track', 'f5.b2': 'Sales funnel by stage', 'f5.b3': 'Today’s agenda when you open it',
    'f6.tag': 'Team & security', 'f6.title': 'Your team, with permissions. Your data, safeguarded.',
    'f6.text': 'Give your salespeople access and decide who manages. Every action is logged with its author and time, and you can revoke access instantly. Every edition includes one user; each additional user has an extra cost.',
    'f6.b1': 'Sign in with username and password', 'f6.b2': 'Sessions close after 15 idle minutes', 'f6.b3': 'Full activity log for the administrator',
    'alt.flow': 'Workflow board', 'alt.cal': 'Weekly hourly calendar', 'alt.lead': 'Full customer record', 'alt.billing': 'Billing: pending and paid',
    'alt.receipt': 'Receipt on a phone', 'alt.dash': 'Dashboard with indicators and charts', 'alt.team': 'Team activity log',
    'gal.kicker': 'Gallery', 'gal.title': 'Take a look inside.', 'gal.prev': 'Previous', 'gal.next': 'Next', 'gal.aria': 'Yakbal screenshots',
    'gal.c1': 'Dashboard · dark theme', 'gal.c2': 'Workflow', 'gal.c3': 'On your phone', 'gal.c4': 'Weekly calendar', 'gal.c5': 'Customer record',
    'gal.c6': 'Receipt ready to share', 'gal.c7': 'Billing & collections', 'gal.c8': 'Dashboard · light theme', 'gal.c9': 'Activity log',
    'demo.kicker': 'Test drive', 'demo.title': 'Try it now. No sign-up.',
    'demo.sub': 'A fictional company with sample customers, appointments and receipts. Move cards, schedule appointments, issue a receipt: nothing you do is saved.',
    'demo.iframe': 'Yakbal interactive demo', 'demo.open': 'Open the demo full screen',
    'ed.kicker': 'Editions', 'ed.title': 'Choose the edition that fits your business.', 'ed.quote': 'Get a quote', 'ed.popular': 'Recommended',
    'ed.e1': 'Essential', 'ed.e1for': 'To start organizing your sales.', 'ed.e1b1': 'Workflow and customer records', 'ed.e1b2': 'Month, week and day calendar',
    'ed.e1b3': 'Dashboard with what is urgent', 'ed.e1b4': '1 user included · extra users at an additional cost',
    'ed.e2': 'Professional', 'ed.e2for': 'For teams that sell and collect every day.', 'ed.e2b1': 'Everything in Essential', 'ed.e2b2': 'Numbered receipts and payment tracking',
    'ed.e2b3': 'Roles, permissions and activity log', 'ed.e2b4': 'Your logo, currency and tax', 'ed.e2b5': 'Add as many users as your team needs',
    'ed.e3': 'Tailored', 'ed.e3for': 'For processes with their own rules.', 'ed.e3b1': 'Everything in Professional', 'ed.e3b2': 'Stages, fields and questions for your industry',
    'ed.e3b3': 'Connection with your other tools', 'ed.e3b4': 'Migration of your current data',
    'ed.note': 'No one-size-fits-all packages: the price depends on the scope, and you get it in writing before we start.',
    'ind.kicker': 'Built for your industry', 'ind.title': 'From the order notebook to a system that never forgets anyone.',
    'ind.text': 'A farm-tank distributor used to write down by hand every prospect who came in from their ads. Today every customer goes into Yakbal with questions specific to the business —what they need it for, what capacity, whether they have the space and by when— and nobody misses their call.',
    'ind.c1': 'Agriculture', 'ind.c2': 'Real estate', 'ind.c3': 'Workshops', 'ind.c4': 'Construction', 'ind.c5': 'Education', 'ind.c6': 'Healthcare', 'ind.c7': 'Professional services', 'ind.c8': 'Distributors',
    'ind.b': 'Before', 'ind.b1': 'Customers written on paper and forgotten calls.', 'ind.a': 'With Yakbal', 'ind.a1': 'Every customer with their stage, next call and receipt, one tap away.',
    'st.kicker': 'How to start', 'st.title': 'Three steps, with someone by your side.',
    'st.s1': 'Message us', 'st.s1t': 'Tell us how you sell today in a WhatsApp message. The first conversation is free.',
    'st.s2': 'We tailor it', 'st.s2t': 'We set up your stages, questions, currency and logo. You get scope, price and timeline in writing.',
    'st.s3': 'Your team uses it', 'st.s3t': 'We train your team and stay with you until everything works.',
    'faq.kicker': 'FAQ', 'faq.title': 'What everyone asks.',
    'q1': 'Do I need to install anything?', 'a1': 'No. Yakbal runs in the browser on your computer and your phone. You just sign in with your username and password.',
    'q2': 'Is my data safe?', 'a2': 'Everyone signs in with their own user, sessions close themselves when idle, only the administrator decides who has access and every action is logged.',
    'q3': 'Does it work on my phone?', 'a3': 'Yes, fully: calendar, records, workflow and receipts. Receipts are shared by WhatsApp or email right from the phone.',
    'q4': 'Can my team use it?', 'a4': 'Yes. Give your salespeople access, choose who manages and revoke access instantly. Every edition includes one user; each additional user has an extra cost.',
    'q5': 'Which currency and language?', 'a5': 'Your country’s currency and tax. The interface is available in Spanish and English.',
    'q6': 'Does it fit my industry?', 'a6': 'Yes. Stages, record questions and appointment types are adjusted to how your business sells.',
    'q7': 'How much does it cost?', 'a7': 'It depends on the edition and what needs tailoring. Message us and in the first conversation we give you a price range, free of charge.',
    'final.title': 'Safeguard every sale.', 'final.text': 'Tell us how you sell today and we’ll show you Yakbal with your own processes.',
    'ftr.by': 'A product of', 'ftr.rights': 'All rights reserved.',
  };
  const TITLE = { es: 'Yakbal · Del primer contacto al último pago', en: 'Yakbal · From first contact to final payment' };
  const MSG = {
    es: { def: '¡Hola! Vi Yakbal y me gustaría saber más para mi empresa.', esencial: '¡Hola! Me interesa la versión Esencial de Yakbal.',
      profesional: '¡Hola! Me interesa la versión Profesional de Yakbal.', medida: '¡Hola! Me interesa Yakbal a la medida de mi negocio.' },
    en: { def: 'Hi! I saw Yakbal and would like to know more for my business.', esencial: 'Hi! I am interested in the Yakbal Essential edition.',
      profesional: 'Hi! I am interested in the Yakbal Professional edition.', medida: 'Hi! I am interested in a tailored Yakbal for my business.' },
  };

  // Guardar el español original para poder volver a él sin recargar
  const ES = {};
  document.querySelectorAll('[data-i18n]').forEach(el => { ES[el.dataset.i18n] = el.innerHTML; });
  const esAttr = (el, attr, key) => { if (!(key in ES)) ES[key] = el.getAttribute(attr); };
  document.querySelectorAll('[data-i18n-alt]').forEach(el => esAttr(el, 'alt', el.dataset.i18nAlt));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => esAttr(el, 'aria-label', el.dataset.i18nAria));
  document.querySelectorAll('[data-i18n-title]').forEach(el => esAttr(el, 'title', el.dataset.i18nTitle));
  document.querySelectorAll('[data-i18n-content]').forEach(el => esAttr(el, 'content', el.dataset.i18nContent));

  function setLang(lang, save) {
    lang = lang === 'en' ? 'en' : 'es';
    const T = k => (lang === 'en' ? EN[k] : ES[k]) ?? ES[k];
    document.documentElement.lang = lang;
    document.title = TITLE[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = T(el.dataset.i18n); if (v != null) el.innerHTML = v; });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => el.setAttribute('alt', T(el.dataset.i18nAlt)));
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', T(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', T(el.dataset.i18nTitle)));
    document.querySelectorAll('[data-i18n-content]').forEach(el => el.setAttribute('content', T(el.dataset.i18nContent)));
    // Capturas en el idioma elegido
    document.querySelectorAll('img[data-shot]').forEach(img => { img.src = `img/shots/${lang}/${img.dataset.shot}.jpg`; });
    // WhatsApp con el mensaje ya escrito
    document.querySelectorAll('[data-wa]').forEach(a => {
      const m = MSG[lang][a.dataset.wa] || MSG[lang].def;
      a.href = `https://wa.me/${WA}?text=${encodeURIComponent(m)}`;
    });
    // Demo en el mismo idioma
    const f = document.getElementById('demoFrame'), o = document.getElementById('demoOpen');
    const demoUrl = `demo/?lang=${lang}`;
    if (o) o.href = demoUrl;
    if (f) { f.dataset.src = demoUrl; if (f.src) f.src = demoUrl; }
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    if (save) try { localStorage.setItem('yk-lang', lang); } catch (e) {}
    const u = new URL(location.href);
    if (lang === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang');
    history.replaceState(null, '', u.toString());
  }

  let lang = new URLSearchParams(location.search).get('lang');
  if (!lang) try { lang = localStorage.getItem('yk-lang'); } catch (e) {}
  if (!lang) lang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  setLang(lang, false);
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang, true)));

  // ── Aparición al hacer scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });

  // ── Cabecera con borde al bajar
  const hdr = document.querySelector('.hdr');
  addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 8), { passive: true });

  // ── Galería: flechas
  const track = document.getElementById('galTrack');
  document.querySelectorAll('[data-gal]').forEach(b => b.addEventListener('click', () => {
    const fig = track.querySelector('figure'); const step = fig ? fig.getBoundingClientRect().width + 20 : 600;
    track.scrollBy({ left: Number(b.dataset.gal) * step, behavior: 'smooth' });
  }));

  // ── La demo solo se carga cuando llega a la pantalla (la página abre rápido)
  const frame = document.getElementById('demoFrame');
  if (frame) new IntersectionObserver((es, ob) => es.forEach(e => { if (e.isIntersecting) { frame.src = frame.dataset.src; ob.disconnect(); } }), { rootMargin: '400px' }).observe(frame);

  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
