// Change this to force update v1.0.4
var CACHE = 'cache-update-and-refresh';

var cachedLocalItems = [
  '/app.css',
  '/images/icon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
];

var cachedRemoteItems = [
  'https://fonts.googleapis.com/css?family=PT+Mono|PT+Sans:400,700'
];

var allCachedItems = cachedLocalItems.concat(cachedRemoteItems);
allCachedItems.push('/offline.html');

self.addEventListener('install', function (e) {
  // Add the following assets on install
  console.log('sw.js -> Install');
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    cache.addAll(allCachedItems)
  }));
});

self.addEventListener('fetch', function (evt) {
  console.log('sw.js -> Fetch ' +evt.request.url);
  // On fetch immediately return from cache if it is something
  // we currently cache
  if(cachedLocalItems.indexOf(evt.request.url.replace(/^https?:\/\/[^/]+\//,"/")) > -1 ||
      cachedRemoteItems.indexOf(evt.request.url)>-1) {

    evt.respondWith(fromCache(evt.request));

    // Then try to get a network version
    evt.waitUntil(update(evt.request).then(refresh));
  } else {
    evt.respondWith(fetch(evt.request).catch(function () {
      console.log("Error caught - offline.html returned");
      return caches.match('/offline.html');
    }));
  }
});

function fromCache(request) {
  console.log('sw.js -> Fetch ' + request.url + ' from cache.');
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request);
  });
}

function update(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response.clone()).then(function () {
        return response;
      });
    });
  }).catch(function(){
    return null;
  });
}

function refresh(response) {
  if(!response) return;
  console.log('sw.js -> Response url ' + response.url);
  console.log('sw.js -> Response headers ' + Array.from(response.headers.keys()));
  return self.clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
 
      var message = {
        type: 'refresh',
        url: response.url,
 
        eTag: response.headers.get('ETag')
      };
 
      client.postMessage(JSON.stringify(message));
    });
  });
}
