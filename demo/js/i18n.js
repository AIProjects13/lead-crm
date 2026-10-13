/* Yakbal · demo: idioma ES/EN.
 * La app está escrita en español; en inglés se traduce el TEXTO VISIBLE (nodos de texto,
 * placeholder, title, aria-label) con un diccionario + reglas para frases con números.
 * Nunca se tocan los valores internos (data-*, value de <option>), así la lógica no cambia.
 */
(function () {
  const qs = new URLSearchParams(location.search);
  let lang = qs.get('lang');
  if (!lang) try { lang = localStorage.getItem('yk-lang'); } catch (e) {}
  if (!lang) lang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  lang = lang === 'en' ? 'en' : 'es';
  window.YK_LANG = lang;
  document.documentElement.lang = lang;

  const DICT = window.YK_DICT || {};   // se rellena en i18n-dict.js
  const RULES = window.YK_RULES || [];
  const AFFIX = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u;

  function core(s) {
    if (DICT[s] !== undefined) return DICT[s];
    for (const [re, rep] of RULES) { if (re.test(s)) return s.replace(re, rep); }
    return null;
  }
  // Traduce un texto: entero, sin símbolos alrededor, o por partes separadas por " · "
  function tr(text) {
    const t = text.trim(); if (!t) return text;
    let out = core(t);
    if (out === null) { const m = t.match(AFFIX); if (m && m[2]) { const c = core(m[2]); if (c !== null) out = m[1] + c + m[3]; } }
    if (out === null && t.includes(' · ')) {
      const parts = t.split(' · ').map(p => { const m = p.match(AFFIX); const c = m && m[2] ? core(m[2]) : null; return c !== null ? m[1] + c + m[3] : p; });
      const j = parts.join(' · '); if (j !== t) out = j;
    }
    if (out !== null) out = out.replace(/[¿¡]/g, ''); // en inglés no se usan
    return out === null ? text : text.replace(t, out);
  }
  window.YK_tr = tr;

  const ATTRS = ['placeholder', 'title', 'aria-label'];
  function walk(root) {
    if (lang !== 'en' || !root) return;
    if (root.nodeType === 3) { const v = tr(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; return; }
    if (root.nodeType !== 1) return;
    const tag = root.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    ATTRS.forEach(a => { if (root.hasAttribute(a)) { const v = root.getAttribute(a), n = tr(v); if (n !== v) root.setAttribute(a, n); } });
    if (tag === 'TEXTAREA') return; // su contenido lo escribe el usuario: no se toca
    if (tag === 'OPTION' && !root.hasAttribute('value')) root.setAttribute('value', root.textContent); // el valor interno no cambia
    if (tag === 'INPUT' && (root.type === 'button' || root.type === 'submit')) { const n = tr(root.value); if (n !== root.value) root.value = n; }
    for (let c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  window.YK_walk = walk;

  // Traduce todo lo que la app pinte después
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') walk(m.target);
      else if (m.type === 'attributes') walk(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  function start() {
    walk(document.body);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // Los diálogos nativos también
  const _c = window.confirm.bind(window), _a = window.alert.bind(window);
  window.confirm = m => _c(lang === 'en' ? tr(m) : m);
  window.alert = m => _a(lang === 'en' ? tr(m) : m);

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lang]').forEach(b => {
      b.classList.toggle('on', b.dataset.lang === lang);
      b.addEventListener('click', () => {
        try { localStorage.setItem('yk-lang', b.dataset.lang); } catch (e) {}
        const u = new URL(location.href); u.searchParams.set('lang', b.dataset.lang); location.href = u.toString();
      });
    });
    const cta = document.getElementById('demoCta');
    if (cta) {
      const msg = lang === 'en' ? 'Hi! I tried the Yakbal demo and I would like it for my business.' : '¡Hola! Probé la demo de Yakbal y me gustaría tenerlo en mi empresa.';
      cta.href = 'https://wa.me/50258253416?text=' + encodeURIComponent(msg);
    }
    if (lang === 'en') start();
  });
})();
