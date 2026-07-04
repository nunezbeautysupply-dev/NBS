var APP_VERSION = '20260704-001';
var CACHE_NAME = 'nbs-' + APP_VERSION;

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return c.add('./index.html');
    }).catch(function(){})
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  // Para navegación siempre red primero
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(function(r){
        // Guardar copia fresca en caché
        var rc = r.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(e.request, rc); });
        return r;
      }).catch(function(){
        // Sin internet usar caché
        return caches.match('./index.html');
      })
    );
    return;
  }
  // Otros archivos: caché primero
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request);
    })
  );
});
