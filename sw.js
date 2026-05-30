const CACHE_NAME = "apoio-mz-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/index.css",
  "/manifest.json"
];

// Install service worker and cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Gracefully fetch and pre-cache resources
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Pre-caching assets partially succeeded:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate handler to clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((allCaches) => {
      return Promise.all(
        allCaches.filter((c) => c !== CACHE_NAME).map((c) => caches.delete(c))
      );
    })
  );
  self.clients.claim();
});

// Fetch responder supporting Network-first fallback to Cache
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests and avoid API calls intercepting
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache clone of successful HTML/CSS/JS requests
        if (networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Safe offline response from Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Default offline page response for main navigations
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
