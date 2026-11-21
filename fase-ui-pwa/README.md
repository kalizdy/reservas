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
| `AUDITORIA-CWV.md` | Medición de LCP/CLS antes/después y checklist de la guía C3-A2 |
| `supabase.js` | Cliente REST/RPC de Supabase con la llave pública |
| `supabase/setup.sql` | **Script único**: esquema + RLS + RPC + semillas |
| `supabase/schema.sql` | Tablas, RLS, restricciones y RPC `crear_reserva` |
| `supabase/seed-juegos.sql` | Carga inicial de los 15 juegos |
| `styles.css`, `script.js`, `data/`, `icons/`, `vendor/`, `*.webp` | Código y recursos del sitio. DOMPurify local en `vendor/dompurify.min.js` |

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
- **Menú móvil**: en pantallas de hasta 760 px aparece una hamburguesa que abre
  el menú lateral como drawer; en escritorio se mantiene el rail fijo.

## Rendimiento, BEM y seguridad

- **Core Web Vitals**: LCP local **1.60 s** y CLS **0** en escritorio; móvil 375×812
  con LCP **0.80 s**. Detalle en `AUDITORIA-CWV.md`.
- **Imágenes WebP** para el héroe, estaciones, catálogo y galería.
- **Preload + `fetchpriority="high"`** del héroe, con `width`/`height` declarados.
- **BEM limpio**: sin selectores ID en CSS, sin estilos inline y con `!important`
  solo en la excepción de `prefers-reduced-motion`.
- **DOMPurify 3.1.6 local** (`vendor/dompurify.min.js`) sanitiza el HTML de los
  toasts antes de usar `.html()`. Si no carga, se usa un respaldo de texto seguro.

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
  snacks, forma de pago y total antes de enviar.
- **Pago en el local:** efectivo, tarjeta o QR al llegar. No se cobra online.
- Al enviar, la reserva se guarda en **Supabase** y aparece **“Reserva enviada”**
  con el código real, el estado `pendiente`, el resumen y la hora de envío.
- Desde la confirmación se puede **cerrar** o iniciar **Nueva reserva**.
- El total es `precio por hora × horas + snacks`, calculado en el servidor.
- **Limitación:** no hay pasarela de pago online; el cobro es presencial. La
  disponibilidad y el solapamiento se controlan en Supabase.

## Base de datos Supabase

El proyecto está conectado a Supabase mediante `supabase.js`:

```text
Project URL: https://depkvzlbomyzaopjiulk.supabase.co
```

La llave usada es la **publishable/anon pública**. La `service_role` nunca se
incluye en el frontend.

### Puesta en marcha (una sola vez)

1. Entrá a **Supabase → SQL Editor → New query**.
2. Pegá y ejecutá **`supabase/setup.sql`** (incluye esquema, RLS, RPC y semillas).
3. Verificá que `estaciones`, `juegos`, `snacks` y `reservas` tengan datos.
4. Para el panel admin, creá el usuario en **Authentication** y ejecutá:

```sql
insert into public.perfiles (user_id, rol)
select id, 'admin' from auth.users where email = 'TU_CORREO_ADMIN';
```

### Cómo funciona

- El catálogo de juegos se lee desde Supabase.
- Si Supabase no responde o no hay red, el catálogo usa `data/juegos.json`
  como respaldo offline.
- La reserva se envía a la RPC `crear_reserva`:
  - valida fecha, hora, horas, personas y snacks,
  - calcula precios en el servidor,
  - evita doble reserva,
  - genera el código real `KG-...`,
  - guarda el estado `pendiente`.
- Si no hay internet, la reserva **no se inventa**: se muestra un error y se
  puede reintentar. El pago sigue siendo en el local.
- Las tablas tienen RLS: catálogo público de lectura, reservas solo por RPC y
  lectura/gestión para administradores autenticados.

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
   - `ASSET_VERSION` en `sw.js` (por ejemplo `20261133` → `20261134`).
   - Los `?v=20261133` de `index.html` (styles, pwa.css, script, hidratacion y pwa.js).
2. Cambiá también `CACHE_NAME` (por ejemplo `kalizdy-pwa-v18` → `kalizdy-pwa-v19`).
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
