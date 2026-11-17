/* =========================================================
   KALIZDY GAME — CAPA PWA (FASE UI)
   Instalación, actualizaciones, atajos y estado de conexión
   ========================================================= */

(function () {
  'use strict';

  var soporteSW = 'serviceWorker' in navigator;
  var esStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true;

  var $instalar = document.getElementById('pwaInstalar');
  var $offline = document.getElementById('pwaOffline');
  var $update = document.getElementById('pwaUpdate');
  var $actualizar = document.getElementById('pwaActualizar');
  var $cerrarUpdate = document.getElementById('pwaCerrarUpdate');

  var promptDiferido = null;
  var registroSW = null;
  var recargando = false;
  var updateOculto = false;

  /* ---------- Atajos del manifest (?panel=reserva) ---------- */
  function abrirPanelDesdeUrl() {
    var params = new URLSearchParams(window.location.search);
    var panel = params.get('panel');

    if (!panel) return;

    if (panel === 'inicio') {
      var home = document.querySelector('.rail-btn[data-panel="inicio"]');
      if (home) home.click();
    } else {
      var boton = document.querySelector('.rail-btn[data-panel="' + panel + '"]');
      if (!boton) return;
      boton.click();
    }

    // Solo limpia la URL cuando el panel realmente se abrió;
    // si no, se reintenta con el evento load.
    if (!document.getElementById('panel-' + panel)?.classList.contains('is-open')) {
      return;
    }

    params.delete('panel');
    var limpia =
      window.location.pathname +
      (params.toString() ? '?' + params.toString() : '') +
      window.location.hash;

    try {
      window.history.replaceState({}, '', limpia);
    } catch (error) {
      // file:// puede bloquear replaceState; el panel ya está abierto
    }
  }

  /* ---------- Aviso de actualización ---------- */
  function mostrarUpdate(registro) {
    if (!registro || !registro.waiting || !$update) return;
    if (updateOculto) return;

    registroSW = registro;
    $update.hidden = false;
  }

  function ocultarUpdate() {
    if ($update) $update.hidden = true;
  }

  function aplicarActualizacion() {
    if (!registroSW || !registroSW.waiting) {
      window.location.reload();
      return;
    }

    recargando = true;
    ocultarUpdate();
    registroSW.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  if ($actualizar) {
    $actualizar.addEventListener('click', aplicarActualizacion);
  }

  if ($cerrarUpdate) {
    $cerrarUpdate.addEventListener('click', function () {
      updateOculto = true;
      ocultarUpdate();
    });
  }

  /* ---------- Estado de conexión ---------- */
  function actualizarConexion() {
    if (!$offline) return;
    $offline.hidden = navigator.onLine;
  }

  window.addEventListener('online', actualizarConexion);
  window.addEventListener('offline', actualizarConexion);

  /* ---------- Instalación ---------- */
  function mostrarBotonInstalar() {
    if (!$instalar || esStandalone) return;
    $instalar.hidden = false;
  }

  function ocultarBotonInstalar() {
    if (!$instalar) return;
    $instalar.hidden = true;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    promptDiferido = event;
    mostrarBotonInstalar();
  });

  if ($instalar) {
    $instalar.addEventListener('click', function () {
      if (!promptDiferido) return;

      var prompt = promptDiferido;
      promptDiferido = null;
      ocultarBotonInstalar();

      prompt.prompt();

      if (prompt.userChoice && typeof prompt.userChoice.then === 'function') {
        prompt.userChoice.then(function (resultado) {
          if (resultado.outcome === 'accepted') {
            console.info('[PWA] App instalada por el usuario');
          }
        });
      }
    });
  }

  window.addEventListener('appinstalled', function () {
    promptDiferido = null;
    ocultarBotonInstalar();
    console.info('[PWA] Kalizdy Game instalada');
  });

  /* ---------- Registro del Service Worker ---------- */
  function registrarSW() {
    if (!soporteSW) {
      console.warn('[PWA] Este navegador no soporta Service Workers');
      return;
    }

    var permitido =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!permitido) {
      console.warn('[PWA] El service worker requiere HTTPS o localhost');
      return;
    }

    navigator.serviceWorker
      .register('sw.js', { updateViaCache: 'none' })
      .then(function (registro) {
        registroSW = registro;

        // Primera visita: activa el SW sin mostrar aviso
        if (registro.waiting) {
          if (navigator.serviceWorker.controller) {
            mostrarUpdate(registro);
          } else {
            registro.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }

        registro.addEventListener('updatefound', function () {
          var nuevo = registro.installing;
          if (!nuevo) return;

          nuevo.addEventListener('statechange', function () {
            if (nuevo.state !== 'installed') return;

            if (navigator.serviceWorker.controller) {
              mostrarUpdate(registro);
            } else {
              // Primera instalación: activa sin pedir recarga
              nuevo.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        console.info('[PWA] Service Worker activo:', registro.scope);
      })
      .catch(function (error) {
        console.warn('[PWA] Service Worker no registrado:', error);
      });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!recargando) return;
      recargando = false;
      window.location.reload();
    });

    // Busca actualizaciones al volver a la pestaña
    var ultimaBusqueda = Date.now();

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible' || !registroSW) return;
      if (Date.now() - ultimaBusqueda < 60 * 1000) return;

      ultimaBusqueda = Date.now();
      registroSW.update().catch(function () {});
    });
  }

  /* ---------- Arranque ---------- */
  function iniciar() {
    if (esStandalone) {
      document.documentElement.classList.add('pwa-standalone');
    }

    if (!promptDiferido && !esStandalone) ocultarBotonInstalar();
    actualizarConexion();

    // Espera a que jQuery y el lobby estén listos antes de aplicar el atajo
    if (window.jQuery) {
      window.jQuery(abrirPanelDesdeUrl);
    } else {
      window.addEventListener('load', abrirPanelDesdeUrl);
    }

    window.addEventListener('load', function () {
      if (!document.querySelector('.panel.is-open')) {
        abrirPanelDesdeUrl();
      }
    });

    registrarSW();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
