const CACHE_NAME = "plazos-misiones-v8";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./logo.png",
  "https://cdn.tailwindcss.com"
];

// Instalación: Guarda los archivos en la caché del navegador
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: Limpia cachés antiguas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de solicitudes: Carga desde caché si no hay conexión
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Retorno de contingencia si falla la red
      });
    })
  );
});
