# Auditoría Core Web Vitals y guía C3-A2

Fecha de medición: 17/11/2026
Proyecto: `fase-ui-pwa` (Kalizdy Game)
Método: Chromium local, `PerformanceObserver` para LCP/CLS, servidor local en un
origen limpio. No es dato de campo (CrUX) ni emulación 4G.

## Resultados

| Métrica / recurso | Antes | Después | Meta |
| --- | --- | --- | --- |
| **LCP escritorio** | 2.12 s (`hero.jpg`) | **1.60 s (`hero.webp`)** | ≤ 2.5 s |
| **LCP móvil 375×812** | — | **0.80 s** | ≤ 2.5 s |
| **CLS escritorio** | 0 | **0** | ≤ 0.1 |
| **CLS móvil** | 0 | **0** | ≤ 0.1 |
| **Peso del héroe** | 138.120 B (JPEG) | **68.484 B (WebP)** | — |
| **TTFB local** | 289 ms | **180 ms** | — |
| **Load local** | 1.568 ms | **1.486 ms** | — |

La mejora de LCP fue de aproximadamente **25 %** solo por convertir el héroe a
WebP y declarar `preload` + `fetchpriority="high"`.

## Cambios aplicados para LCP/CLS

- Héroe convertido a `hero.webp` (calidad 82).
- Todas las imágenes del catálogo, estaciones y galería convertidas a WebP.
- `<link rel="preload" as="image" href="hero.webp" fetchpriority="high">`.
- Héroe con `width`, `height`, `fetchpriority="high"` y `decoding="async"`.
- Imágenes de tarjetas con `width`, `height`, `loading="lazy"` y `decoding="async"`.
- `aspect-ratio` en tarjetas y carrusel.
- JS/CSS con versión (`?v=20261133`) y Service Worker que evita respuestas viejas.

Los `.jpg` originales se conservan para `manifest.json` (screenshots) y Open Graph,
pero la app usa `.webp`.

## BEM y especificidad

| Indicador | Antes | Después |
| --- | --- | --- |
| Clases con nomenclatura BEM | 240 | **241** |
| Reglas CSS con selectores ID | 9 | **0** |
| `!important` en `styles.css` | 14 | **3** (solo `prefers-reduced-motion`) |
| `!important` en `pwa.css` | 2 | **0** |
| Estilos inline en HTML | 1 | **0** |

Cambios principales:

- `#consolas` → `.equipos-panel`.
- `#filtrosJuegos` → `.juegos-filtros`.
- `#resumenSnacksLista` → `.resumen-snacks`.
- `#slideActual` dentro de CSS → `.carrusel__meta-value`.
- `#pwaOffline`/`#pwaUpdate` en CSS → `.pwa-banner--offline`/`.pwa-banner--update`.
- Barra de XP con clase `.side-player__xp-fill` en lugar de `style="width:64%"`.
- Se reemplazaron los `!important` por selectores más específicos.
- Los 3 `!important` restantes son la excepción de accesibilidad para
  `prefers-reduced-motion`.

## DOMPurify

- Librería local: `vendor/dompurify.min.js` (versión **3.1.6**), cacheada por el SW.
- Se sanitiza el HTML de `mostrarToast()` antes de `$toast.html(...)`.
- Configuración: solo `strong`, `b`, `em`, `br`, `span`; sin atributos.
- Si DOMPurify no carga, el respaldo elimina etiquetas y muestra texto seguro.
- Prueba con `<img src=x onerror="window.__xss=1"><strong>Hack</strong>`:
  el `img` y el `onerror` fueron eliminados, el `strong` se conservó y el XSS
  no se ejecutó.

## Service Worker

- Caché actual: `kalizdy-pwa-v18`.
- Precarga el shell, catálogo, WebP, DOMPurify, iconos y `offline.html`.
- Prueba offline real: lobby, 15 juegos, imágenes WebP, hidratación y formulario
  cargan sin servidor; una ruta desconocida muestra `offline.html`.

## Limitaciones de esta auditoría

- Medición de laboratorio en localhost, no datos de campo.
- No se emuló 4G/CPU lenta; conviene repetir con Lighthouse móvil o WebPageTest.
- El LCP puede variar por fuentes de Google y red del hosting.
- No hay pasarela de pago online: el cobro es presencial y las reservas se
  guardan en Supabase con estado `pendiente`.
