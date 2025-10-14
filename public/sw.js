const CACHE_NAME = 'school-life-helper-v1';
const urlsToCache = [
  '/simpleInfo/',
  '/simpleInfo/index.html',
  '/simpleInfo/assets/index-B_qN5Mnq.js',
  '/simpleInfo/assets/index-DrlUxP42.css',
  '/simpleInfo/logo.png',
  '/simpleInfo/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
