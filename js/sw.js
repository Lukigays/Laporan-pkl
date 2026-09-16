// ============================================================
// SERVICE WORKER — CACHING & OFFLINE MODE
// ============================================================

const CACHE_NAME = 'laporan-pkl-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './js/config.js',
  './js/particles.js',
  './js/utils.js',
  './js/auth.js',
  './js/tour.js',
  './js/profil.js',
  './js/laporan.js',
  './js/backup.js',
  './js/pdf.js',
  './js/kamera.js',
  './js/badge.js',
  './js/harikerja.js',
  './js/pwa.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
