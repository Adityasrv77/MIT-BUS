const CACHE_NAME = 'mit-bus-v2';
const STATIC_ASSETS = ['/', '/role-select', '/guest', '/credits'];

// ── Service Worker Events ──────────────────────────────────────────────────

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
  // Pass-through for API calls (Firebase/Supabase)
  if (event.request.url.includes('supabase') || event.request.url.includes('firebaseio')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── Background Sync ────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-gps') {
    event.waitUntil(flushGpsQueue());
  }
});

async function flushGpsQueue() {
  const db = await openDb();
  const tx = db.transaction('gps-updates', 'readwrite');
  const store = tx.objectStore('gps-updates');
  const updates = await getAll(store);

  for (const update of updates) {
    try {
      // Re-push to your API/Firebase
      // In a real app, you'd use fetch() here
      console.log('Syncing background update:', update);
      await store.delete(update.id);
    } catch (err) {
      console.error('Failed to sync update:', err);
    }
  }
}

// ── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = { title: 'MIT Bus', body: 'New update available' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// ── IndexedDB Helpers ──────────────────────────────────────────────────────

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mit-bus-db', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('gps-updates', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
