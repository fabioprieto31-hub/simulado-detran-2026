const CACHE_NAME = 'detran-sim-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/public/manifest.json',
  '/public/favicon.ico',
  '/public/logo192.png',
  '/public/logo512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Estratégia: Cache First, falling back to Network, then Cache
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Verifica se a resposta é válida antes de cachear
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clona a resposta para salvar no cache para uso futuro (offline)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback opcional se offline e sem cache (pode retornar uma página offline customizada aqui)
      });
    })
  );
});