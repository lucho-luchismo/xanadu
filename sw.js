self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('xanadu-cache').then(cache => cache.addAll(['./']))
  );
});
