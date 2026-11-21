/* =========================================================
   KALIZDY GAME — CLIENTE SUPABASE
   REST + RPC con la llave pública (publishable). Sin secretos.
   ========================================================= */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://depkvzlbomyzaopjiulk.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_yaSBTajdYysZ0aQt0rTsxQ_UqyjWHcG';
  var TIMEOUT_MS = 12000;

  function cabeceras(extra) {
    var base = {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    };

    if (extra) {
      Object.keys(extra).forEach(function (key) {
        base[key] = extra[key];
      });
    }

    return base;
  }

  async function pedir(ruta, opciones) {
    var config = opciones || {};
    var control = new AbortController();
    var temporizador = setTimeout(function () {
      control.abort();
    }, TIMEOUT_MS);

    try {
      var respuesta = await fetch(SUPABASE_URL + '/rest/v1/' + ruta, {
        method: config.method || 'GET',
        headers: cabeceras(config.headers),
        body: config.body,
        signal: control.signal
      });

      var texto = await respuesta.text();
      var datos = null;

      if (texto) {
        try {
          datos = JSON.parse(texto);
        } catch (error) {
          datos = texto;
        }
      }

      if (!respuesta.ok) {
        var mensaje = (datos && (
          datos.message ||
          datos.error_description ||
          datos.hint ||
          datos.details
        )) || 'Error HTTP ' + respuesta.status;

        var fallo = new Error(mensaje);
        fallo.status = respuesta.status;
        fallo.code = datos && datos.code;
        throw fallo;
      }

      return datos;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('La conexión con Supabase tardó demasiado. Revisá tu red.');
      }

      throw error;
    } finally {
      clearTimeout(temporizador);
    }
  }

  function catalogo() {
    return pedir(
      'juegos?select=id,titulo,plataforma,genero,jugadores,portada&activo=eq.true&order=orden.asc'
    );
  }

  function estaciones() {
    return pedir(
      'estaciones?select=id,nombre,tipo,precio_hora,descripcion&activa=eq.true&order=orden.asc'
    );
  }

  function snacks() {
    return pedir(
      'snacks?select=id,nombre,descripcion,precio,icono&activo=eq.true&order=orden.asc'
    );
  }

  function crearReserva(payload) {
    return pedir('rpc/crear_reserva', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  window.KalizdyDB = {
    url: SUPABASE_URL,
    configurado: true,
    catalogo: catalogo,
    estaciones: estaciones,
    snacks: snacks,
    crearReserva: crearReserva
  };
})();
