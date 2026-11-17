/* =========================================================
   KALIZDY GAME — HIDRATACIÓN DE ESTADO
   Restaura sobre el HTML estático: tema, snacks, cola y
   borrador de reserva. Persiste en localStorage.
   ========================================================= */

(function () {
  'use strict';

  var CLAVE = (function () {
    var ruta = window.location.pathname
      .replace(/\/index\.html$/i, '/')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    return 'kalizdy:estado:v1:' + (ruta || 'inicio');
  })();
  var aplicando = false;
  var ejecutado = false;
  var guardarTimer = null;

  function leerEstado() {
    try {
      var bruto = window.localStorage.getItem(CLAVE);
      if (!bruto) return null;

      var estado = JSON.parse(bruto);
      return estado && typeof estado === 'object' ? estado : null;
    } catch (error) {
      return null;
    }
  }

  function guardarAhora() {
    if (aplicando || !window.KalizdyGame) return;

    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(window.KalizdyGame.estado()));
    } catch (error) {
      // Modo privado o almacenamiento lleno: la app sigue funcionando
    }
  }

  function programarGuardado() {
    if (aplicando) return;

    window.clearTimeout(guardarTimer);
    guardarTimer = window.setTimeout(guardarAhora, 250);
  }

  function limpiarEstado() {
    try {
      window.localStorage.removeItem(CLAVE);
    } catch (error) {
      // Sin almacenamiento disponible
    }
  }

  function marcarHidratado(estado) {
    document.documentElement.setAttribute('data-hydrated', 'true');

    window.KalizdyHydration = {
      clave: CLAVE,
      leer: leerEstado,
      guardar: guardarAhora,
      limpiar: limpiarEstado
    };

    window.dispatchEvent(
      new CustomEvent('kalizdy:hydrated', {
        detail: { restaurado: Boolean(estado) }
      })
    );

    if (window.console && console.info) {
      console.info(
        '[Hidratación] Estado ' +
        (estado ? 'restaurado desde localStorage' : 'inicializado')
      );
    }
  }

  function hidratar() {
    if (ejecutado) return;

    if (!window.KalizdyGame) {
      // script.js todavía no expuso la API; se reintenta con load/timeout
      return;
    }

    ejecutado = true;

    var estado = leerEstado();

    aplicando = true;

    try {
      if (estado) window.KalizdyGame.aplicar(estado);
    } catch (error) {
      console.warn('[Hidratación] No se pudo aplicar el estado:', error);
    }

    // Guarda cambios del usuario (delegado, con debounce)
    document.addEventListener('click', programarGuardado, true);
    document.addEventListener('input', programarGuardado, true);
    document.addEventListener('change', programarGuardado, true);
    document.addEventListener('kalizdy:catalogo-listo', guardarAhora);

    window.addEventListener('pagehide', guardarAhora);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') guardarAhora();
    });

    window.setTimeout(function () {
      aplicando = false;
      marcarHidratado(estado);
    }, 0);
  }

  document.addEventListener('DOMContentLoaded', hidratar);
  window.addEventListener('load', hidratar);
  window.setTimeout(hidratar, 500);

  if (document.readyState !== 'loading') {
    hidratar();
  }
})();
