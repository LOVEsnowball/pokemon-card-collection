const CACHE_NAME = 'pokemon-collection-v14'; // Vue3+Vite 重构升级

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只拦截 http(s) 请求，跳过扩展、浏览器内部等 scheme，避免缓存保存失败
  if (!(url.protocol === 'http:' || url.protocol === 'https:')) return;

  // Network-first for app shell, so card data stays fresh but app works offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((m) => m || caches.match('/')))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(
      (m) => m || fetch(event.request).then((res) => {
        if (event.request.method === 'GET' && res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
        }
        return res;
      }).catch(() => m)
    )
  );
});