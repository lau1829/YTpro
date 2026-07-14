const CACHE_NAME = 'ytpro-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requests que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests de video streaming (son muy grandes)
  if (event.request.url.includes('googlevideo.com') || 
      event.request.url.includes('youtube.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si no está en cache, devolver página offline
          return caches.match('/');
        });
      })
  );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
