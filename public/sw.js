const CACHE_NAME = 'pokemon-collection-__BUILD_ID__'; // 构建时由 vite 自动注入，无需手动升版本

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      ),
      self.clients.claim()
    ]).then(async () => {
      // 新版本接管后强制刷新所有打开的页面，避免旧缓存长期锁死导致白屏
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: false });
      clients.forEach((c) => c.navigate(c.url));
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只拦截 http(s) 请求，跳过扩展、浏览器内部等 scheme，避免缓存保存失败
  if (!(url.protocol === 'http:' || url.protocol === 'https:')) return;

  // 图片：network-first，优先回源拿最新，避免坏缓存卡死旧图；回源失败才用缓存兜底
  if (event.request.destination === 'image') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          // 仅缓存成功的图片响应，防止错误占位图被写进缓存
          if (res && res.status === 200 && (res.headers.get('content-type') || '').includes('image')) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

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