/* Poker Royal — Service Worker
 * App-Shell-Caching, damit die App offline startet.
 * Bei jeder Aenderung an der App: CACHE_VERSION hochzaehlen.
 */
const CACHE_VERSION = 'v3';
const CACHE_NAME = `poker-royal-shell-${CACHE_VERSION}`;

// Relative Pfade -> funktioniert auch unter /poker-royale/ auf GitHub Pages
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Einzeln cachen, damit ein fehlendes Asset die Installation nicht killt
    await Promise.all(APP_SHELL.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
    ));
    // Neue Version sofort aktivieren (Update beim naechsten Start sauber uebernehmen)
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Alte Caches entfernen
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isSameOrigin(url) {
  return new URL(url, self.location.href).origin === self.location.origin;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Supabase/API nie cachen
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  // Navigationen: network-first, Fallback auf gecachte App-Shell (offline-faehig)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', preload.clone());
          return preload;
        }
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Statische Assets (eigene + CDN): stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    }).catch(() => null);

    if (cached) return cached;
    const res = await network;
    if (res) return res;
    if (isSameOrigin(req.url)) {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    return Response.error();
  })());
});


