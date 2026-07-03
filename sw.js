// Service Worker que NUNCA cachea index.html
var CACHE_VERSION = '2026-07-01-v10';
var CACHE_NAME = 'nbs-' + CACHE_VERSION;

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  // Borrar TODOS los cachés anteriores
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  // NUNCA cachear index.html - siempre de la red
  if(e.request.mode === 'navigate' || 
     e.request.url.indexOf('index.html') > -1 ||
     e.request.url.endsWith('/NBS/') ||
     e.request.url.endsWith('/NBS')){
    e.respondWith(
      fetch(e.request, {
        cache: 'no-store',
        headers: {'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache'}
      }).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }
  // Otros recursos: red primero
  e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
});
