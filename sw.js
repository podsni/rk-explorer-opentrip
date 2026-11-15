const CACHE_NAME = 'rk-explorer-pwa-v4';
const APP_SHELL = [
  '/',
  '/base.css',
  '/mobile.css',
  '/app.js',
  '/manifest.webmanifest',
  '/assets/favicon.svg',
  '/assets/apple-touch-icon.png',
  '/assets/pwa-192.png',
  '/assets/pwa-512.png',
  '/assets/pwa-512-maskable.png',
  '/assets/bromo-01.webp',
  '/assets/bromo-02.webp',
  '/assets/tumpak-02.webp',
  '/assets/bukit-landscape.webp',
  '/assets/ijen-02.webp',
  '/assets/bromo-01.jpg',
  '/assets/bromo-02.jpg',
  '/assets/tumpak-02.jpg',
  '/assets/ijen-02.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('rk-explorer-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cachedPage = await caches.match('/');
      try {
        const response = await fetch(request);
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('/', response.clone()));
        return response;
      } catch {
        return cachedPage || new Response('<!doctype html><html lang="id"><meta charset="utf-8"><title>RK Explorer offline</title><body><h1>RK Explorer</h1><p>Buka kembali setelah halaman sempat dimuat saat online.</p></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
