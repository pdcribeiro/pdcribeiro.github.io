const CACHE = 'chorus-v3';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'audio.js',
  'recorder.js',
  'ui.js',
  'storage.js',
  'manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('index.html');
      return fetch(event.request);
    })
  );
});
