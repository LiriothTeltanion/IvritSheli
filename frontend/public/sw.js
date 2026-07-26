// Module: offline application shell
// Purpose: Cache only public UI assets while keeping all private API traffic network-only.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: API responses and user data are deliberately never cached by the service worker.

const CACHE_NAME = 'ivrit-sheli-shell-v2.8.3-visual-r2';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/app-icon.svg',
  '/icons/app-icon-192.png',
  '/icons/app-icon-512.png',
  '/content/starter-dictionary-v2.8.json',
  '/illustrations/regions/galilee.webp',
  '/illustrations/regions/haifa-carmel.webp',
  '/illustrations/regions/tel-aviv-jaffa.webp',
  '/illustrations/regions/jerusalem.webp',
  '/illustrations/regions/dead-sea.webp',
  '/illustrations/regions/negev.webp',
];
const NETWORK_ONLY_PATHS = new Set(['/health/live', '/health/ready', '/version']);
const PUBLIC_STATIC_PREFIXES = ['/assets/', '/content/', '/icons/', '/illustrations/'];

function canCache(response) {
  const cacheControl = response.headers.get('Cache-Control') || '';
  return response.ok && !cacheControl.toLowerCase().includes('no-store');
}

function isPublicStaticPath(pathname) {
  return pathname === '/manifest.webmanifest'
    || pathname === '/sw.js'
    || PUBLIC_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET'
    || url.origin !== self.location.origin
    || url.pathname.startsWith('/api/')
    || NETWORK_ONLY_PATHS.has(url.pathname)
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (canCache(response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Do not opportunistically cache arbitrary same-origin routes. This allowlist
  // prevents a future non-API endpoint from accidentally placing user data in
  // the public application-shell cache.
  if (!isPublicStaticPath(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (canCache(response)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
