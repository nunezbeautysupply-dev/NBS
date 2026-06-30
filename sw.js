var CACHE_NAME = 'nbs-cache-v1';
var FILES_TO_CACHE = [
  './',
  './index.html'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.filter(function(name){
          return name !== CACHE_NAME;
        }).map(function(name){
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request).then(function(response){
      return response || fetch(event.request).then(function(fetchResponse){
        return caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
