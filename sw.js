// Venstre Syddjurs PWA v2.0.0 — GitHub Pages safe service worker
const CACHE_VERSION = 'venstre-syddjurs-v2-20260702';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return;
  if (url.origin !== self.location.origin) return;

  // Navigation fallback: under /venstre-app/ skal appen altid lande på index.html, aldrig GitHub 404.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) return res;
        return caches.match('./index.html');
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Venstre Syddjurs', body: 'Der er nyt indhold.' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: data.url || './' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || './';
  event.waitUntil(self.clients.openWindow(target));
});
