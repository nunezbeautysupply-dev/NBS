var CACHE = 'nbs-v1';

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.add('./index.html');
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.mode === 'navigate'){
    e.respondWith(
      // Red primero, caché como respaldo offline
      fetch(e.request).then(function(r){
        // Actualizar caché con versión nueva
        var rc = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, rc); });
        return r;
      }).catch(function(){
        // Sin internet - usar versión guardada
        return caches.match('./index.html');
      })
    );
    return;
  }
  e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
});
