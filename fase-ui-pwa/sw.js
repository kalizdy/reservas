/* =========================================================
   KALIZDY GAME — SERVICE WORKER (FASE UI PWA)
   Shell + catálogo offline, actualizaciones controladas
   ========================================================= */

const CACHE_NAME = 'kalizdy-pwa-v12';
const CACHE_PREFIX = 'kalizdy-pwa-';
const OFFLINE_URL = './offline.html';
const ASSET_VERSION = '20261127';

const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  `./styles.css?v=${ASSET_VERSION}`,
  `./pwa.css?v=${ASSET_VERSION}`,
  `./script.js?v=${ASSET_VERSION}`,
  `./hidratacion.js?v=${ASSET_VERSION}`,
  `./pwa.js?v=${ASSET_VERSION}`,
  './manifest.json',
  './data/juegos.json',
  './vendor/jquery-3.7.1.min.js',
  './hero.jpg',
  './ps5.jpg',
  './ps5-setup.jpg',
  './pc.jpg',
  './torneos.jpg',
  './snacks.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

/* ---------- Instalación: precarga del shell ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Precarga tolerante: si un recurso falla, el resto se guarda igual.
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            const request = new Request(new URL(url, self.registration.scope), {
              cache: 'reload'
            });
            await cache.add(request);
          } catch (error) {
            console.warn('[SW] No se pudo precachear:', url, error);
          }
        })
      );
    })()
  );
});

/* ---------- Activación: limpia versiones viejas ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.disable();
        } catch (error) {
          // Algunos navegadores no permiten desactivarlo; no bloquea la activación
        }
      }

      await self.clients.claim();
    })()
  );
});

/* ---------- Mensajes desde la página ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------- Utilidades de caché ---------- */
async function putInCache(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* Respuesta offline: exacta, shell del lobby u offline.html */
async function respuestaOffline(request) {
  const exacta = await caches.match(request);
  if (exacta) return exacta;

  const ruta = new URL(request.url).pathname;
  const esShell = ruta.endsWith('/') || ruta.endsWith('/index.html');

  if (esShell) {
    // Ignora query strings: cubre ?source=pwa y los atajos ?panel=...
    const index = await caches.match('./index.html', { ignoreSearch: true });
    if (index) return index;
  }

  return (await caches.match(OFFLINE_URL)) || null;
}

/* Red primero con respaldo en caché y página offline */
async function networkFirst(request) {
  try {
    // En navegaciones se evita la caché HTTP para no servir un index viejo
    var peticion = request;

    if (request.mode === 'navigate') {
      peticion = new Request(request.url, {
        cache: 'reload',
        credentials: 'same-origin',
        headers: request.headers,
        redirect: 'follow'
      });
    }

    const response = await fetchWithTimeout(peticion, 5000);

    if (response && response.ok) {
      await putInCache(request, response);
      return response;
    }

    return (await respuestaOffline(request)) || response;
  } catch (error) {
    const offline = await respuestaOffline(request);
    if (offline) return offline;

    if (request.mode === 'navigate') {
      return new Response(
        '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
          '<p style="font-family:sans-serif;padding:2rem">Sin conexión y sin copia local. ' +
          'Volvé a intentar cuando recuperes internet.</p>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    throw error;
  }
}

/* Caché primero, con actualización silenciosa */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(request, response);
  return response;
}

/* Caché inmediata + revalidación en segundo plano */
async function staleWhileRevalidate(request, event, forzarRed) {
  const cached = await caches.match(request);

  // En código y estilos se evita la caché HTTP para que una versión nueva
  // no quede tapada por una respuesta vieja del navegador.
  const network = fetch(request, forzarRed ? { cache: 'reload' } : undefined)
    .then(async (response) => {
      await putInCache(request, response);
      return response;
    })
    .catch(() => null);

  // Mantiene vivo el worker hasta terminar la revalidación
  if (event && typeof event.waitUntil === 'function') {
    event.waitUntil(network);
  }

  return cached || (await network) || Response.error();
}

/* ---------- Fetch ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Solo recursos del mismo origen y esquemas http(s)
  if (url.origin !== self.location.origin) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navegación: red primero, luego copia cacheada u offline.html
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Catálogo: datos frescos con respaldo offline
  if (url.pathname.endsWith('/data/juegos.json')) {
    event.respondWith(staleWhileRevalidate(request, event));
    return;
  }

  // Código y estilos: se actualizan solos sin bloquear la carga
  if (
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/pwa.css') ||
    url.pathname.endsWith('/script.js') ||
    url.pathname.endsWith('/pwa.js') ||
    url.pathname.endsWith('/manifest.json')
  ) {
    event.respondWith(staleWhileRevalidate(request, event, true));
    return;
  }

  // Imágenes, iconos y fuentes locales: caché primero
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Resto de estáticos del mismo origen
  event.respondWith(staleWhileRevalidate(request, event));
});
