/* 工作台 Service Worker：缓存应用外壳，支持离线 / 秒开；不缓存跨域的 GitHub API */
const CACHE = 'pw-v2';
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // 跨域（如 api.github.com）走网络，不被缓存
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
