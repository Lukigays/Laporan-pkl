const CACHE_NAME = 'pkl-app-lukyy-v1';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

// Menginstall service worker dan cache file penting
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Memberikan respon dari cache saat offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Kembalikan file dari cache jika ada, jika tidak ambil dari internet
        return response || fetch(event.request);
      })
  );
});
