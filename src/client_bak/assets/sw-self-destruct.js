// This is a special service worker designed to avoid
// issues after we moved to a new url getset.ml and then again to getset.ga
// see here for more info:
// https://blog.hackages.io/migrating-a-service-worker-from-an-old-domain-to-your-new-domain-69236418051c
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', () => {
  self.registration.unregister();
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    for (const client of clients) {
      client.navigate(client.url);
    }
  });
});
