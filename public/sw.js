// PayStore POS Service Worker for PWA Builder
const CACHE_NAME = 'paystore-pos-v2';
const OFFLINE_URL = '/';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/manifest.webmanifest'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
  // NOTE: Removed self.skipWaiting() — do NOT take over the page automatically.
  // This prevents the app from refreshing without user action.
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // NOTE: Removed self.clients.claim() — do NOT forcefully claim open tabs.
});

// Fetch event - keep navigation requests on cache-first to avoid silent reloads,
// and let everything else pass through to the network without SW interference.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // Don't intercept Vite HMR / dev assets — those need fresh network responses.
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // For navigation (HTML) requests: try cache first, then network.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(OFFLINE_URL).then((cached) => {
        return (
          cached ||
          fetch(event.request).catch(() => caches.match(OFFLINE_URL))
        );
      })
    );
    return;
  }

  // For other same-origin GETs: network-first with cache fallback (no auto-update of HTML).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && !url.pathname.endsWith('.html')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'PayStore POS', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

console.log('[SW] PayStore POS Service Worker loaded');
