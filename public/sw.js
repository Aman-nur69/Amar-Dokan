/* =============================================================================
 * Amar Dokan (আমার দোকান) Service Worker
 *
 * Without this the app could not start without a network at all: the shop's
 * data was offline-first, but the application shell itself was not. A dokandar
 * closing the tab on a dead 2G link could not reopen the till.
 *
 * Strategy:
 *   - navigation requests : network-first, falling back to the cached shell
 *   - hashed build assets : cache-first (Vite fingerprints every filename)
 *   - Google Fonts        : stale-while-revalidate, so Bengali type survives
 *                           an outage instead of falling back to a system face
 *   - Supabase / APIs     : never cached; the sync queue owns that traffic
 * ========================================================================== */

const VERSION = 'v2';
const SHELL_CACHE = `amar-dokan-shell-${VERSION}`;
const ASSET_CACHE = `amar-dokan-assets-${VERSION}`;
const FONT_CACHE = `amar-dokan-fonts-${VERSION}`;

const SHELL_URLS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch((err) => console.warn('[SW] Shell precache incomplete:', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, ASSET_CACHE, FONT_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isFontRequest(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept Supabase or any other API traffic — a stale write response
  // would corrupt the sync queue's view of what actually reached the server.
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return;
  if (url.hostname.endsWith('supabase.co')) return;

  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
