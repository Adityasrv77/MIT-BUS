const CACHE_NAME = 'mit-bus-v1';
const STATIC_ASSETS = ['/', '/role-select', '/guest', '/credits'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first for API calls, cache first for static assets
  if (event.request.url.includes('supabase') || event.request.url.includes('firebaseio')) {
    return; // Don't cache API calls
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
