// ============================================================
// Nordic Info — Service Worker
// App-shell caching + offline fallback + push-notifikationer
// ============================================================

const CACHE_VERSION = 'nordic-info-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// --- Install: cache app-shell -------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// --- Activate: ryd gamle caches -------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// --- Fetch: netværk først, fallback til cache (offline) -------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Kun GET-requests cache'es
  if (req.method !== 'GET') return;

  // Supabase API-kald: altid netværk (data skal være friskt)
  if (req.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});

// --- Push-notifikationer ---------------------------------------------------
// Bemærk: selve afsendelsen af push-beskeder sker server-side
// (fx via en Supabase Edge Function med VAPID private key).
// Denne handler modtager og viser beskeden i browseren.
self.addEventListener('push', (event) => {
  let data = { title: 'Nordic Info', body: 'Der er nyt indhold.' };
  try { data = event.data.json(); } catch (e) { /* almindelig tekst-payload */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      data: { url: data.url || './index.html' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const url = event.notification.data?.url || './index.html';
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
