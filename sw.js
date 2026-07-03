// Cambiar este número cada vez que se sube una versión nueva a GitHub
var CACHE_VERSION = '2026-07-01-v3';
var CACHE_NAME = 'nbs-cache-' + CACHE_VERSION;

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return c.addAll(['./','./index.html']);
    })
  );
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  // Eliminar cachés viejos automáticamente
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Para index.html siempre ir a la red primero, caché como respaldo
  if(e.request.url.indexOf('index.html') > -1 || e.request.url.endsWith('/')){
    e.respondWith(
      fetch(e.request).then(function(r){
        var rc = r.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(e.request, rc); });
        return r;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function(r){
        return r || fetch(e.request);
      })
    );
  }
});
