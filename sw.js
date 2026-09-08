const CACHE = "zorgplan-v3";
const FILES = [
  "./",
  "./index.html",
  "./persoon.html",
  "./zorgverleners.html",
  "./gegevens.html",
  "./print.html",
  "./over.html",
  "./404.html",
  "./favicon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json",
  "./css/styles.css",
  "./js/storage.js",
  "./js/common.js",
  "./js/overzicht.js",
  "./js/persoon.js",
  "./js/zorgverleners.js",
  "./js/gegevens.js",
  "./js/print.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          if (cached) {
            return cached;
          }
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return Response.error();
        });
      })
  );
});
