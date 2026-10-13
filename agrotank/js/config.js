/* Configuración de esta instancia (Agrotank). No contiene secretos:
 * - api: URL /exec de la implementación de Apps Script (no cambia al publicar una "Nueva versión").
 * - firebase: configuración pública del proyecto de autenticación (la misma que ve cualquier navegador).
 * La seguridad real está en el servidor: cada petición exige un token de Firebase válido y un usuario dado de alta. */
window.AGRO_CONFIG = Object.freeze({
  api: 'https://script.google.com/macros/s/AKfycbwaCo5AMiNOwTCnt3fAAb1KYQI3-1fxA51QI8NYGUD2d4Uh-s7yxAKOxXahs1asQdWcpw/exec',
  firebase: Object.freeze({
    apiKey: 'AIzaSyD3P1zTnWwW6VonvZghgVTnb0Eokxr7AzE',
    authDomain: 'personal-32795.firebaseapp.com',
    projectId: 'personal-32795',
    appId: '1:411479894150:web:3792309bfe01b025874907',
  }),
});
