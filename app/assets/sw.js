self.addEventListener('install', function (e) {
  e.waitUntil(caches.open('getset').then(function (cache) {
    cache.addAll([
      '/offline.html',
      '/app.css',
      '/images/icon.svg',
      '/favicon-32x32.png',
      '/favicon-16x16.png',
    ])
  }));
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    // Try the cache
    caches.match(event.request).then(function (response) {
      // Fall back to network
      return response || fetch(event.request);
    }).catch(function () {
      // If both fail, show a generic fallback:
      return caches.match('/offline.html');
      // However, in reality you'd have many different
      // fallbacks, depending on URL & headers.
      // Eg, a fallback silhouette image for avatars.
    })
  );
});
