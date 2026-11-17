// ============================================================
// SERVICE WORKER — CACHING & OFFLINE MODE (FLAT DESIGN BUILD)
// ============================================================

const CACHE_NAME = 'laporan-pkl-jurnal-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/theme.css',
  './css/fonts/inter-400-latin.woff2',
  './css/fonts/inter-500-latin.woff2',
  './css/fonts/inter-600-latin.woff2',
  './css/fonts/inter-700-latin.woff2',
  './css/fonts/inter-800-latin.woff2',
  './css/fonts/inter-400-latin-ext.woff2',
  './css/fonts/inter-500-latin-ext.woff2',
  './css/fonts/inter-600-latin-ext.woff2',
  './css/fonts/inter-700-latin-ext.woff2',
  './css/fonts/inter-800-latin-ext.woff2',
  './js/vendor/tailwind.js',
  './js/vendor/localforage.min.js',
  './js/vendor/confetti.browser.min.js',
  './css/fonts/emoji-1.woff2',
  './css/fonts/emoji-2.woff2',
  './css/fonts/emoji-3.woff2',
  './css/fonts/emoji-4.woff2',
  './css/fonts/emoji-5.woff2',
  './css/fonts/emoji-7.woff2',
  './css/fonts/emoji-9.woff2',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './favicon.png',
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
  './js/liburnasional.js',
  './js/harikerja.js',
  './js/pwa.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
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
