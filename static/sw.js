// Service Worker pour Mirokai Admin PWA
const CACHE_NAME = 'mirokai-admin-v1';

// Assets à mettre en cache pour le mode offline
const STATIC_ASSETS = [
  '/admin',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activer immédiatement le nouveau service worker
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur le cache
self.addEventListener('fetch', (event) => {
  // Ne gérer que les requêtes vers /admin
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes non-GET et les requêtes externes
  if (event.request.method !== 'GET') return;
  if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/icons')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse fraîche
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, utiliser le cache
        return caches.match(event.request);
      })
  );
});
