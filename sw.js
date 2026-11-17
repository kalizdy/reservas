/* =========================================================
   KALIZDY GAME — SERVICE WORKER
   PWA offline: shell + catálogo de juegos
   ========================================================= */

const CACHE_NAME = 'kalizdy-game-v9';
const CACHE_PREFIX = 'kalizdy-game-';
const ASSET_VERSION = '20261132';

const APP_SHELL = [
  './',
  './index.html',
  `./styles.css?v=${ASSET_VERSION}`,
  `./script.js?v=${ASSET_VERSION}`,
  `./hidratacion.js?v=${ASSET_VERSION}`,
  './manifest.json',
  './data/juegos.json',
  './vendor/jquery-3.7.1.min.js',
  './vendor/dompurify.min.js',
  './hero.webp',
  './ps5.webp',
  './ps5-setup.webp',
  './pc.webp',
  './torneos.webp',
  './snacks.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

/* ---------- Instalación: precarga del shell ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ---------- Activación: limpia versiones viejas ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------- Estrategias ---------- */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackUrl) {
  const fallback = async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (fallbackUrl) {
      const shell = await caches.match(fallbackUrl);
      if (shell) return shell;
    }

    return null;
  };

  try {
    var peticion = request;

    // Evita servir un index viejo desde la caché HTTP al navegar
    if (request.mode === 'navigate') {
      peticion = new Request(request.url, {
        cache: 'reload',
        credentials: 'same-origin',
        headers: request.headers,
        redirect: 'follow'
      });
    } else if (request.destination === 'script' || request.destination === 'style') {
      // Fuerza la versión nueva de CSS/JS después de publicar cambios
      peticion = new Request(request.url, {
        cache: 'reload',
        credentials: 'same-origin',
        headers: request.headers,
        redirect: 'follow'
      });
    }

    const response = await fetch(peticion);

    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }

    // Servidor caído o respuesta 4xx/5xx: usa la copia offline
    const cached = await fallback();
    return cached || response;
  } catch (error) {
    const cached = await fallback();
    if (cached) return cached;
    throw error;
  }
}

/* ---------- Fetch ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Solo manejamos recursos del mismo origen
  if (url.origin !== self.location.origin) return;

  // Navegación: red primero, luego index cacheado
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  // Catálogo: red primero para tener datos frescos, caché como respaldo
  if (url.pathname.endsWith('/data/juegos.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Código y estilos: red primero para que los cambios se vean al recargar
  if (url.pathname.endsWith('/styles.css') || url.pathname.endsWith('/script.js')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Estáticos: caché primero
  event.respondWith(cacheFirst(request));
});
