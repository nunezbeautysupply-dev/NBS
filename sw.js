// Service Worker de NBS - permite abrir la app sin internet.
//
// ESTRATEGIA: "Red primero, cache de respaldo"
// - Si hay internet: SIEMPRE pide la version mas nueva al servidor (igual que antes),
//   y de paso actualiza la copia guardada localmente. Esto evita el problema viejo
//   de quedarse atascado en una version vieja.
// - Si NO hay internet: usa la ultima copia que se guardo cuando si habia conexion.
//
// Importante: para hacer match en el cache, se ignora el "?v=..." que agrega
// index.html (ese numero cambia cada vez, y si no lo ignoramos nunca encontraria
// la copia guardada).

var CACHE_NAME = 'nbs-cache-v2';
var ARCHIVOS_BASE = [
  './',
  './index.html',
  './app.html',
  './app_prueba_firebase.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARCHIVOS_BASE).catch(function(err){
        console.log('No se pudo guardar algun archivo base:', err);
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(nombres) {
      return Promise.all(
        nombres.filter(function(n){ return n !== CACHE_NAME; })
               .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Convierte una URL a su version "limpia" (sin ?v=... ni otros parametros)
// para que el cache siempre encuentre la copia guardada sin importar el query string.
function urlLimpia(url) {
  var u = new URL(url);
  u.search = '';
  return u.href;
}

self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Solo nos interesa cachear GET de nuestro propio origen (no Google Fonts, no APIs externas)
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return; // deja pasar la peticion normal, sin tocarla
  }

  var keyLimpia = urlLimpia(req.url);

  event.respondWith(
    fetch(req).then(function(respuestaRed) {
      // Hay internet: guardamos copia fresca (usando la URL limpia como llave) y la devolvemos
      var copia = respuestaRed.clone();
      caches.open(CACHE_NAME).then(function(cache){
        cache.put(keyLimpia, copia);
      });
      return respuestaRed;
    }).catch(function() {
      // No hay internet: buscamos la ultima copia guardada
      return caches.match(keyLimpia).then(function(respuestaCache){
        return respuestaCache || caches.match('./app_prueba_firebase.html') || caches.match('./app.html');
      });
    })
  );
});
