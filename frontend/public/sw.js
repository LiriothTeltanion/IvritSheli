// Module: offline application shell
// Purpose: Cache only public UI assets while keeping all private API traffic network-only.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: API responses and user data are deliberately never cached by the service worker.

const CACHE_NAME = 'ivrit-sheli-shell-v2.12.2-assistant-and-theme-boot';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/app-icon.svg',
  '/icons/app-icon-192.png',
  '/icons/app-icon-512.png',
  '/fonts/GveretLevin-Regular.ttf',
  // 2026-08-24: the interface typeface. Without these the app falls back to
  // whatever the device happens to have, which is the state it was in before
  // Assistant was bundled -- a different-looking product per machine, and the
  // Hebrew set in a different face from the interface around it.
  '/fonts/assistant-latin.woff2',
  '/fonts/assistant-hebrew.woff2',
  '/content/starter-dictionary-v2.8.json',
  '/assets/illustrations/israel-living-atlas-field-notes.webp',
  '/assets/illustrations/morning-hebrew-welcome.webp',
  '/illustrations/regions/galilee-field-notes.webp',
  '/illustrations/regions/galilee-field-notes-portrait.webp',
  '/illustrations/regions/haifa-carmel-field-notes.webp',
  '/illustrations/regions/haifa-carmel-field-notes-portrait.webp',
  '/illustrations/regions/tel-aviv-jaffa-field-notes.webp',
  '/illustrations/regions/tel-aviv-jaffa-field-notes-portrait.webp',
  '/illustrations/regions/jerusalem-field-notes.webp',
  '/illustrations/regions/jerusalem-field-notes-portrait.webp',
  '/illustrations/regions/dead-sea-field-notes.webp',
  '/illustrations/regions/dead-sea-field-notes-portrait.webp',
  '/illustrations/regions/negev-field-notes.webp',
  '/illustrations/regions/negev-field-notes-portrait.webp',
];
const NETWORK_ONLY_PATHS = new Set(['/health/live', '/health/ready', '/version']);
const PUBLIC_STATIC_PREFIXES = ['/assets/', '/content/', '/fonts/', '/icons/', '/illustrations/'];

function canCache(response) {
  const cacheControl = response.headers.get('Cache-Control') || '';
  return response.ok && !cacheControl.toLowerCase().includes('no-store');
}

function isPublicStaticPath(pathname) {
  return pathname === '/manifest.webmanifest'
    || pathname === '/sw.js'
    // 2026-08-24: this one sits at the root rather than under a cached prefix,
    // so without naming it here it would be fetched from the network every
    // time and would simply fail offline -- bringing back the flash of the
    // wrong theme for exactly the learner who is offline most.
    || pathname === '/theme-boot.js'
    || PUBLIC_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const ESSENTIAL_ASSETS = [
  '/',
  // Essential, not optional: it runs before the first paint, and a page that
  // cannot load it shows the wrong theme until the application catches up.
  '/theme-boot.js',
  '/manifest.webmanifest',
  '/icons/app-icon.svg',
  '/icons/app-icon-192.png',
  '/icons/app-icon-512.png',
  '/fonts/GveretLevin-Regular.ttf',
  '/content/starter-dictionary-v2.8.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // The shell is required: without it there is no offline app.
      await cache.addAll(ESSENTIAL_ASSETS);
      // The region art is desirable but optional, and it is ~4.7 MB. Cached one
      // by one so a single failure costs one picture, not offline mode.
      const optional = CORE_ASSETS.filter((asset) => !ESSENTIAL_ASSETS.includes(asset));
      await Promise.allSettled(optional.map((asset) => cache.add(asset)));
    }),
  );
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

const REMINDER_COPY = {
  en: {
    title: 'Ivrit Sheli',
    body: 'Your short Hebrew practice is ready.',
  },
  es: {
    title: 'Ivrit Sheli',
    body: 'Tu práctica breve de hebreo está lista.',
  },
  he: {
    title: 'העברית שלי',
    body: 'התרגול הקצר שלך בעברית מוכן.',
  },
};

function reminderPayload(event) {
  if (!event.data) return {};
  try {
    const payload = event.data.json();
    return payload && typeof payload === 'object' ? payload : {};
  } catch {
    return {};
  }
}

function reminderPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/?view=today';
  }
  return value;
}

self.addEventListener('push', (event) => {
  const payload = reminderPayload(event);
  const locale = payload.locale === 'es' || payload.locale === 'he' ? payload.locale : 'en';
  const copy = REMINDER_COPY[locale];
  event.waitUntil(self.registration.showNotification(copy.title, {
    body: copy.body,
    icon: '/icons/app-icon-192.png',
    badge: '/icons/app-icon-192.png',
    tag: 'ivrit-sheli-daily-practice',
    renotify: false,
    data: { path: reminderPath(payload.path) },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = reminderPath(event.notification.data?.path);
  const destination = new URL(path, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const sameOriginWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (sameOriginWindow) {
      return sameOriginWindow.focus().then((client) => {
        if ('navigate' in client) return client.navigate(destination);
        return client;
      });
    }
    return self.clients.openWindow(destination);
  }));
});
