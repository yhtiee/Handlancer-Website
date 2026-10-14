/*
 * HandLancer app service worker — scope /app (registered by
 * components/app/pwa.tsx in production only).
 *
 * Deliberately small. What it caches:
 *   - /_next/static/*      cache-first: content-hashed, never changes.
 *   - /app/providers, /brand, icons
 *                           stale-while-revalidate: photos and marks.
 *   - /app page loads       network-first, falling back to the last copy of
 *                           that page, then to /offline.html.
 * What it never touches: Supabase (cross-origin — balances, jobs and payments
 * must always be live), any non-GET, and anything outside /app.
 *
 * Bump VERSION to drop every old cache on the next visit.
 */
const VERSION = 'v1';
const STATIC = `hl-static-${VERSION}`;
const PAGES = `hl-pages-${VERSION}`;
const MEDIA = `hl-media-${VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll([OFFLINE_URL, '/icon-192.png', '/brand/logo-mark.webp']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  if (/^\/(app\/providers|brand)\/|^\/icon-/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, MEDIA));
    return;
  }

  if (request.mode === 'navigate' && (url.pathname === '/app' || url.pathname.startsWith('/app/'))) {
    event.respondWith(networkFirstPage(request));
  }
});

async function cacheFirst(request, name) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(name)).put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, name) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fresh;
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    // Only real pages: a redirect to sign-in must not be cached as the page.
    if (res.ok && !res.redirected) (await caches.open(PAGES)).put(request, res.clone());
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

// ─────────────────────────── Web push ───────────────────────────
// Payload shape (send-push's web branch): { title, body, url?, tag? }.

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'HandLancer';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag,
      data: { url: data.url || '/app/notifications' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/app', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.startsWith(self.location.origin + '/app'));
      if (open) return open.focus().then((w) => w.navigate(target));
      return self.clients.openWindow(target);
    }),
  );
});
