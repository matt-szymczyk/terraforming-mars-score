const VERSION = '__BUILD_VERSION__';
const CACHE_PREFIX = 'terraforming-mars-score:' + self.registration.scope + ':';
const CACHE_NAME = CACHE_PREFIX + VERSION;
const ASSETS = ['./', './index.html', './style.css', './app.js', './scoring.js', './storage.js', './i18n.js', './offline.js', './favicon.svg'];
const urls = ASSETS.map(path => new URL(path, self.location.href).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !urls.includes(url.origin + url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(request, { ignoreSearch: true }) || fetch(request);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
  if (event.data?.type === 'CHECK_OFFLINE') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const complete = (await Promise.all(urls.map(url => cache.match(url)))).every(Boolean);
      event.ports[0]?.postMessage({ ready: complete, version: VERSION });
    })());
  }
});
