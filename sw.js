var CACHE_VERSION = '2026-07-01-v6';
var CACHE_NAME = 'nbs-cache-' + CACHE_VERSION;

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return c.addAll(['./sw.js']);
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  var url = e.request.url;
  
  // Para index.html SIEMPRE ir a la red, nunca usar caché
  if(url.endsWith('/') || url.indexOf('index.html') > -1 || url.indexOf('NBS/') > -1 && !url.indexOf('.') > -1){
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }
  
  // Para otros archivos, red primero y caché como respaldo
  e.respondWith(
    fetch(e.request, {cache: 'no-store'}).then(function(r){
      var rc = r.clone();
      caches.open(CACHE_NAME).then(function(c){ c.put(e.request, rc); });
      return r;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
