/* Evita que otra web incruste estas páginas dentro de la suya (clickjacking).
 * Un sitio estático no puede enviar la cabecera X-Frame-Options, así que se hace aquí:
 * solo se permite estar dentro de un marco del MISMO sitio (la demo dentro de la página). */
(function () {
  if (window.top === window.self) return;
  let sameSite = false;
  try { sameSite = window.top.location.origin === window.location.origin; } catch (e) { sameSite = false; }
  if (!sameSite) {
    document.documentElement.style.display = 'none';
    try { window.top.location = window.self.location.href; } catch (e) { /* el navegador lo impide: la página queda oculta */ }
  }
})();
