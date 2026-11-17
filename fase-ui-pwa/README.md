# Fase UI PWA — Kalizdy Game

Esta carpeta contiene la **versión PWA completa y autocontenida** del proyecto.
El sitio original (raíz de `Juegosgamer`) ya tenía una base PWA; acá se entrega
la fase UI terminada, con instalación, actualizaciones, atajos y modo offline real.

## Qué incluye

| Archivo | Función |
| --- | --- |
| `index.html` | Lobby con botón **Instalar app** y avisos de conexión/actualización |
| `manifest.json` | Identidad de la app, iconos, atajos, screenshots y modo standalone |
| `sw.js` | Service Worker: precarga del shell, offline.html y estrategias por tipo de recurso |
| `offline.html` | Pantalla de respaldo cuando no hay red ni copia en caché |
| `pwa.js` | Registro del SW, instalación, aviso de nueva versión, atajos y estado online |
| `pwa.css` | Estilos de los controles PWA integrados a la estética HUD |
| `hidratacion.js` | Hidratación de estado: tema, snacks, cola y borrador de reserva en `localStorage` |
| `styles.css`, `script.js`, `data/`, `icons/`, `vendor/`, `*.jpg` | Código y recursos del sitio |

## Funcionalidades PWA

- **Instalable**: botón “Instalar app” visible cuando el navegador lo permite.
- **Standalone**: al instalarse abre sin barra del navegador y con `theme-color`.
- **Offline**: se precargan HTML, CSS, JS, catálogo, imágenes e iconos.
- **Navegación offline**: si una pantalla no está en caché, se muestra `offline.html`.
- **Datos del catálogo**: `stale-while-revalidate` (responde rápido y se actualiza solo).
- **Actualizaciones controladas**: banner “Nueva versión disponible” con botón
  **Actualizar**; no se recarga a mitad de una reserva.
- **Atajos de app**: Reservar, Juegos y Snacks desde el icono instalado
  (`?panel=reserva`, `?panel=juegos`, `?panel=snacks`).
- **Estado de conexión**: aviso “Sin conexión” y recuperación automática al volver la red.

## Hidratación de estado

La app es HTML estático + jQuery, no un framework con SSR, así que no usa la
hidratación de React/Next. Sí incorpora una **capa de hidratación ligera**:

1. `index.html` llega completo desde el servidor.
2. `hidratacion.js` lee el estado guardado en `localStorage`.
3. `script.js` expone `window.KalizdyGame` y aplica ese estado sobre el DOM existente.
4. Se restauran tema, snacks, cola de juegos y borrador de reserva sin re-renderizar
   toda la página ni duplicar eventos.
5. Cada cambio del usuario se guarda con debounce y también al salir de la página.

Clave usada: `kalizdy:estado:v1:<ruta>` (por ejemplo `...:fase-ui-pwa` o
`...:inicio`), para que la app raíz y la carpeta PWA no compartan estado.
API disponible: `window.KalizdyHydration` (`leer`, `guardar`, `limpiar`).
El estado se guarda **solo en el dispositivo** y no se envía a ningún servidor.

## Redes sociales

- **Instagram:** enlace directo a `@kalizdygame` en Contacto, en el bloque
  “Redes sociales” y en el pie del panel lateral.
- **WhatsApp:** enlaces directos a `wa.me/59175867586` en el header y en
  Contacto/Redes sociales.
- Metadatos **Open Graph** y **Twitter Card** para que al compartir el enlace
  aparezca título, descripción e imagen.
- Para publicar, reemplazá `og:image` y `twitter:image` por la URL absoluta final.
- El enlace de Instagram usa el handle `@kalizdygame` que ya figuraba en el sitio.
  No se agregaron Facebook/TikTok porque el proyecto no incluía sus URLs; si los
  tenés, se suman al mismo bloque.

## Lógica de reservas

- Horario del local: **14:00 a 23:00**; última entrada **22:00**.
- Si la fecha es hoy, se deshabilitan los horarios ya pasados.
- La cantidad máxima de horas se ajusta según la hora de inicio para no cerrar
  después de las 23:00 (por ejemplo, a las 22:00 solo se permite 1 hora).
- El botón **Alquilar hora** preselecciona fecha y próximo horario disponible.
- El modal de confirmación muestra estación, fecha, hora, personas, horas,
  snacks y total antes de enviar.
- Al enviar se simula el envío: aparece **“Reserva enviada”** con un código,
  el resumen completo y la hora de envío. **No hay backend**: es una simulación
  local, no se envía nada ni se cobra.
- Desde la confirmación se puede **cerrar** o iniciar **Nueva reserva**.
- El total es `precio por hora × horas + snacks`.
- **Limitación:** no hay backend ni control real de disponibilidad/doble reserva.

## Cómo probarlo

El Service Worker **no funciona abriendo el archivo con doble clic** (`file://`).
Usá un servidor local desde esta carpeta:

```bash
cd fase-ui-pwa
python -m http.server 8080
```

Luego abrí `http://localhost:8080`.

### Probar la instalación

1. Abrí la app en Chrome/Edge (Android o escritorio).
2. Esperá el botón **Instalar app** en la barra superior (o usá el icono de instalar
   de la barra de direcciones).
3. En iOS/Safari: **Compartir → Añadir a pantalla de inicio** (iOS no dispara el
   botón automático).

### Probar el modo offline

1. Cargá la app una vez con red.
2. En DevTools → **Application → Service Workers**, activá **Offline**.
3. Recargá: el lobby y el catálogo deben seguir funcionando.
4. Entrá a una URL desconocida del scope: se muestra `offline.html`.

### Probar una actualización

1. Cambiá la versión en dos lugares:
   - `ASSET_VERSION` en `sw.js` (por ejemplo `20261127` → `20261128`).
   - Los `?v=20261127` de `index.html` (styles, pwa.css, script, hidratacion y pwa.js).
2. Cambiá también `CACHE_NAME` (por ejemplo `kalizdy-pwa-v12` → `kalizdy-pwa-v13`).
3. Recargá dos veces: aparece el banner **Nueva versión disponible**.
4. Presioná **Actualizar**: el SW toma el control y la página se recarga una vez.

> El `?v=` evita que el navegador reutilice un `script.js` o `styles.css`
> viejo de su caché HTTP después de publicar cambios.

## Checklist de auditoría (DevTools → Application)

- [x] Manifest válido con `name`, `short_name`, `start_url`, `scope`, `display`.
- [x] Iconos 192, 512 y maskable 512.
- [x] Service Worker registrado en `https`/`localhost`.
- [x] Precaché del shell y del catálogo.
- [x] Fallback offline para navegación.
- [x] `theme-color` y `apple-touch-icon`.
- [x] Atajos y screenshots en el manifest.
- [x] Botón de instalación y flujo de actualización.

## Nota sobre el proyecto original

La carpeta raíz `Juegosgamer` recibió los mismos arreglos de lógica de reservas,
redes sociales e hidratación, más la corrección de filtros y de caché del Service
Worker. La versión PWA completa y autocontenida sigue siendo esta carpeta
`fase-ui-pwa`, publicable tal cual en cualquier hosting estático siempre que se
sirva por HTTPS.
