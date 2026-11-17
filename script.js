/* =========================================================
   KALIZDY GAME — PS5 & PC GAMER
   Diseño Web II · UPDS 2026
   jQuery 3.7.1 · DOM, filtros, acordeón, carrusel y validación
   ========================================================= */

$(function () {
  'use strict';

  /* =======================================================
     0) RELOJ HUD
     ======================================================= */
  function dosDigitos(numero) {
    return numero < 10 ? '0' + numero : String(numero);
  }

  function actualizarReloj() {
    var ahora = new Date();
    $('#reloj').text(
      dosDigitos(ahora.getHours()) + ':' +
      dosDigitos(ahora.getMinutes()) + ':' +
      dosDigitos(ahora.getSeconds())
    );
  }

  actualizarReloj();
  setInterval(actualizarReloj, 1000);

  /* =======================================================
     1) THEME TOGGLE (modo oscuro / claro)
     ======================================================= */
  $('#themeToggle').on('click', function () {
    var $body = $('body');
    var isLight = $body.hasClass('theme-light');

    if (isLight) {
      $body.removeClass('theme-light');
    } else {
      $body.addClass('theme-light');
    }

    $(this)
      .attr('aria-pressed', isLight ? 'false' : 'true')
      .attr('aria-label', isLight ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')
      .find('.theme-toggle__icon').html(isLight ? '☀' : '🌙').end()
      .find('.theme-toggle__label').html(isLight ? 'Modo claro' : 'Modo oscuro');

    $('meta[name="theme-color"]').attr('content', isLight ? '#04060c' : '#e8eef7');
  });

  /* =======================================================
     1.5) NAVEGACIÓN DEL LOBBY (PANELES)
     ======================================================= */
  var panelActual = null;

  function abrirPanel(nombre) {
    if (!nombre || nombre === 'inicio') {
      cerrarPaneles();
      return;
    }

    var $panel = $('#panel-' + nombre);
    if (!$panel.length) return;

    panelActual = nombre;

    $('.panel').removeClass('is-open').attr('aria-hidden', 'true');
    $panel.addClass('is-open').attr('aria-hidden', 'false');

    $('#panelLayer')
      .attr('aria-hidden', 'false')
      .stop(true, true)
      .css({ display: 'flex', opacity: 0 })
      .animate({ opacity: 1 }, 180);

    $('body').addClass('panel-open');

    $('.rail-btn').removeClass('is-active').attr('aria-pressed', 'false');
    $('.rail-btn[data-panel="' + nombre + '"]')
      .addClass('is-active')
      .attr('aria-pressed', 'true');

    if (nombre === 'galeria') {
      reiniciarAutoplay();
    }

    if (nombre === 'reserva') {
      actualizarHorasDisponibles();
    }

    setTimeout(function () {
      $panel.find('.panel__close').trigger('focus');
    }, 200);
  }

  function cerrarPaneles() {
    panelActual = null;

    $('.panel').removeClass('is-open').attr('aria-hidden', 'true');
    $('#panelLayer')
      .stop(true, true)
      .animate({ opacity: 0 }, 150, function () {
        $(this).css('display', 'none').attr('aria-hidden', 'true');
      });

    $('body').removeClass('panel-open');
    $('.rail-btn').removeClass('is-active').attr('aria-pressed', 'false');
    $('.rail-btn[data-panel="inicio"]')
      .addClass('is-active')
      .attr('aria-pressed', 'true');

    detenerAutoplay();
  }

  $(document).on('click', '[data-open-panel]', function () {
    abrirPanel($(this).data('open-panel'));
  });

  $(document).on('click', '[data-close-panel]', function () {
    cerrarPaneles();
  });

  $('.rail-btn').on('click', function () {
    abrirPanel($(this).data('panel'));
    cerrarMenu(false);
  });

  $('#brandHome').on('click', function (event) {
    event.preventDefault();
    cerrarPaneles();
  });

  /* =======================================================
     1.6) MENÚ MÓVIL (HAMBURGUESA + DRAWER)
     ======================================================= */
  var menuAbierto = false;
  var $lobbyRail = $('#lobbyRail');
  var $menuToggle = $('#menuToggle');
  var $railBackdrop = $('#railBackdrop');

  function menuEsMovil() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  function actualizarMenuAccesibilidad() {
    if (!menuEsMovil()) {
      $lobbyRail.removeAttr('inert').attr('aria-hidden', 'false');
      return;
    }

    if (menuAbierto) {
      $lobbyRail.removeAttr('inert').attr('aria-hidden', 'false');
    } else {
      $lobbyRail.attr('inert', '').attr('aria-hidden', 'true');
    }
  }

  function abrirMenu() {
    if (!menuEsMovil() || menuAbierto) return;

    menuAbierto = true;
    $('body').addClass('menu-open');
    $lobbyRail.addClass('is-open');
    $menuToggle.attr({ 'aria-expanded': 'true', 'aria-label': 'Cerrar menú' });
    actualizarMenuAccesibilidad();

    setTimeout(function () {
      $('#railClose').trigger('focus');
    }, 180);
  }

  function cerrarMenu(devolverFoco) {
    if (!menuAbierto) return;

    menuAbierto = false;
    $('body').removeClass('menu-open');
    $lobbyRail.removeClass('is-open');
    $menuToggle.attr({ 'aria-expanded': 'false', 'aria-label': 'Abrir menú' });
    actualizarMenuAccesibilidad();

    if (devolverFoco) {
      $menuToggle.trigger('focus');
    }
  }

  $menuToggle.on('click', function () {
    if (menuAbierto) {
      cerrarMenu(true);
    } else {
      abrirMenu();
    }
  });

  $('#railClose').on('click', function () {
    cerrarMenu(true);
  });

  $railBackdrop.on('click', function () {
    cerrarMenu(true);
  });

  $lobbyRail.on('keydown', function (event) {
    if (!menuAbierto || event.key !== 'Tab') return;

    var $focos = $lobbyRail.find('button, a[href]').filter(':visible');
    if (!$focos.length) return;

    var primero = $focos[0];
    var ultimo = $focos[$focos.length - 1];

    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  });

  $(window).on('resize orientationchange', function () {
    if (!menuEsMovil()) {
      cerrarMenu(false);
    }

    actualizarMenuAccesibilidad();
  });

  actualizarMenuAccesibilidad();

  /* =======================================================
     2) SELECTOR DE CONSOLAS (PS5 / PC GAMER)
     fadeOut() / fadeIn() + addClass() / removeClass() + .html()
     ======================================================= */
  var zonas = {
    all: { icon: '🎲', label: 'Todas las estaciones' },
    ps5: { icon: '🎮', label: 'PS5' },
    pc:  { icon: '🖥', label: 'PC Gamer' }
  };

  $('#consolas .btn-console').on('click', function () {
    var cat = $(this).data('cat');
    var zona = zonas[cat] || zonas.all;

    $('#consolas .btn-console')
      .removeClass('is-active')
      .attr('aria-pressed', 'false');
    $(this).addClass('is-active').attr('aria-pressed', 'true');

    $('#consolas')
      .removeClass('zona-all zona-ps5 zona-pc')
      .addClass('zona-' + cat);

    $('#zonaIcon').html(zona.icon);
    $('#zonaLabel').text(zona.label);

    var $cards = $('.equipo-card');
    $cards.stop(true, true).fadeOut(180).promise().done(function () {
      if (cat === 'all') {
        $cards.fadeIn(320);
      } else {
        $cards.filter('[data-cat="' + cat + '"]').fadeIn(320);
      }
    });
  });

  /* =======================================================
     3) ACORDEÓN DE FICHAS TÉCNICAS
     ======================================================= */
  $('.btn-detalles').on('click', function () {
    var $btn = $(this);
    var $card = $btn.closest('.equipo-card');
    var $panel = $card.find('.equipo-detalles');
    var isOpen = $card.hasClass('is-open');

    $('.equipo-card').not($card).removeClass('is-open');
    $('.equipo-card').not($card).find('.equipo-detalles').slideUp('slow');
    $('.btn-detalles').not($btn).attr('aria-expanded', 'false');
    $('.btn-detalles').not($btn).find('.btn-detalles__sign').text('+');

    $panel.slideToggle('slow');
    $card.toggleClass('is-open');
    $btn.attr('aria-expanded', isOpen ? 'false' : 'true');
    $btn.find('.btn-detalles__sign').text(isOpen ? '+' : '−');
  });

  /* Acordeón de preguntas frecuentes */
  $('.faq-q').on('click', function () {
    var $btn = $(this);
    var $item = $btn.closest('.faq-item');
    var isOpen = $item.hasClass('is-open');

    $('.faq-item').not($item).removeClass('is-open');
    $('.faq-item').not($item).find('.faq-a').slideUp('slow');
    $('.faq-item').not($item).find('.faq-q').attr('aria-expanded', 'false');
    $('.faq-item').not($item).find('.faq-q__sign').text('+');

    $item.toggleClass('is-open');
    $item.find('.faq-a').slideToggle('slow');
    $btn.attr('aria-expanded', isOpen ? 'false' : 'true');
    $btn.find('.faq-q__sign').text(isOpen ? '+' : '−');
  });

  /* =======================================================
     3.5) CATÁLOGO ASÍNCRONO DE JUEGOS
     fetch() + JSON + renderizado dinámico + delegación .off().on()
     ======================================================= */
  var juegos = [];
  var colaJuegos = [];
  var colaPendiente = null;
  var filtroJuegos = 'all';

  function plataformaCategoria(plataforma) {
    return String(plataforma).toUpperCase().indexOf('PC') !== -1 ? 'pc' : 'ps5';
  }

  function buscarJuego(id) {
    for (var i = 0; i < juegos.length; i++) {
      if (juegos[i].id === id) return juegos[i];
    }
    return null;
  }

  function renderJuegos() {
    var $grid = $('#catalogoJuegos').empty();

    var visibles = $.grep(juegos, function (juego) {
      return filtroJuegos === 'all' || plataformaCategoria(juego.plataforma) === filtroJuegos;
    });

    if (!visibles.length) {
      $('<p>')
        .addClass('juegos-vacio')
        .text('No hay juegos para este filtro.')
        .appendTo($grid);
      $('#juegosCount').text('0 juegos');
      return;
    }

    $.each(visibles, function (_, juego) {
      var enCola = $.inArray(juego.id, colaJuegos) !== -1;

      var $card = $('<article>')
        .addClass('juego-card')
        .attr({
          'data-id': juego.id,
          'data-cat': plataformaCategoria(juego.plataforma)
        });

      var $media = $('<div>').addClass('juego-card__media');

      $('<img>')
        .attr({
          src: juego.portada,
          alt: 'Portada de ' + juego.titulo,
          loading: 'lazy',
          decoding: 'async',
          width: 480,
          height: 270
        })
        .appendTo($media);

      $('<span>')
        .addClass('juego-card__tag juego-card__tag--' + plataformaCategoria(juego.plataforma))
        .text(juego.plataforma)
        .appendTo($media);

      var $body = $('<div>').addClass('juego-card__body');

      $('<h3>').text(juego.titulo).appendTo($body);
      $('<p>').text(juego.genero + ' · ' + juego.jugadores).appendTo($body);

      var $foot = $('<div>').addClass('juego-card__foot');

      $('<button>')
        .attr({
          type: 'button',
          'class': 'btn-cola-juego' + (enCola ? ' is-added' : ''),
          'data-id': juego.id,
          'aria-pressed': enCola ? 'true' : 'false'
        })
        .html(enCola ? '✓ En cola' : '＋ Cola')
        .appendTo($foot);

      $foot.appendTo($body);
      $card.append($media).append($body).appendTo($grid);
    });

    $('#juegosCount').text(visibles.length + (visibles.length === 1 ? ' juego disponible' : ' juegos disponibles'));
  }

  function actualizarCola() {
    var $lista = $('#colaJuegosLista').empty();

    if (!colaJuegos.length) {
      $('<li>')
        .addClass('cola-juegos__empty')
        .text('Todavía no elegiste juegos.')
        .appendTo($lista);
    } else {
      $.each(colaJuegos, function (_, id) {
        var juego = buscarJuego(id);
        if (!juego) return;

        $('<li>')
          .addClass('cola-juegos__item')
          .attr('data-id', id)
          .append($('<span>').text(juego.titulo))
          .append(
            $('<button>')
              .attr({
                type: 'button',
                'class': 'cola-juegos__remove',
                'data-id': id,
                'aria-label': 'Quitar ' + juego.titulo + ' de la cola'
              })
              .html('×')
          )
          .appendTo($lista);
      });
    }

    var total = colaJuegos.length;

    $('#colaCount').text(total);
    $('#colaTotal').text(total + (total === 1 ? ' juego' : ' juegos'));
    $('#sideJuegos').text(total);
    $('#railJuegoCount')
      .text(total)
      .toggleClass('is-on', total > 0);

    $('.btn-cola-juego').each(function () {
      var $btn = $(this);
      var id = String($btn.data('id'));
      var activo = $.inArray(id, colaJuegos) !== -1;

      $btn
        .toggleClass('is-added', activo)
        .attr('aria-pressed', activo ? 'true' : 'false')
        .html(activo ? '✓ En cola' : '＋ Cola');
    });
  }

  function cargarJuegos() {
    var $estado = $('#catalogoEstado');

    $('#catalogoJuegos').attr('aria-busy', 'true').empty();
    $estado
      .removeClass('is-error')
      .html('<span class="juegos-estado__spinner" aria-hidden="true"></span> Cargando catálogo de juegos…')
      .show();
    $('#juegosCount').text('Cargando catálogo…');

    fetch('data/juegos.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Error HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Formato de catálogo inválido');
        }

        juegos = data;
        $('#catalogoJuegos').attr('aria-busy', 'false');
        $estado.hide();
        renderJuegos();
        actualizarCola();

        // Hidratación: recupera la cola guardada si el catálogo tardó en cargar
        if (colaPendiente) {
          var pendientes = colaPendiente;
          colaPendiente = null;
          colaJuegos = $.grep(pendientes, function (id) {
            return !!buscarJuego(String(id));
          });
          actualizarCola();
        }

        document.dispatchEvent(new CustomEvent('kalizdy:catalogo-listo'));

        if (window.console && console.info) {
          console.info('Catálogo cargado:', juegos.length, 'juegos');
        }
      })
      .catch(function (error) {
        console.error('Fallo en catálogo:', error);

        $('#catalogoJuegos').attr('aria-busy', 'false').empty();
        $('#juegosCount').text('Catálogo no disponible');
        $estado
          .addClass('is-error')
          .html(
            '<strong>No se pudo cargar el catálogo.</strong> ' +
            'Si abriste el archivo con doble clic, usá un servidor local ' +
            '(por ejemplo: <code>python -m http.server</code>).'
          )
          .show();

        $('<button>')
          .attr({
            type: 'button',
            id: 'reintentarCatalogo',
            'class': 'btn btn--ghost reintentar-catalogo'
          })
          .text('Reintentar')
          .appendTo($estado);
      });
  }

  /* Delegación de eventos: los botones se crean después del fetch.
     .off().on() evita handlers duplicados si el catálogo se vuelve a renderizar. */
  $('#catalogoJuegos')
    .off('click', '.btn-cola-juego')
    .on('click', '.btn-cola-juego', function () {
      var id = String($(this).data('id'));
      var juego = buscarJuego(id);
      var indice = $.inArray(id, colaJuegos);

      if (!juego) return;

      if (indice === -1) {
        colaJuegos.push(id);
        mostrarToast(
          '<strong>Juego agregado a la cola</strong>' + juego.titulo,
          'ok'
        );
      } else {
        colaJuegos.splice(indice, 1);
        mostrarToast(
          '<strong>Juego quitado de la cola</strong>' + juego.titulo,
          'ok'
        );
      }

      actualizarCola();
    });

  $('#colaJuegosLista')
    .off('click', '.cola-juegos__remove')
    .on('click', '.cola-juegos__remove', function () {
      var id = String($(this).data('id'));
      var indice = $.inArray(id, colaJuegos);

      if (indice !== -1) {
        colaJuegos.splice(indice, 1);
        actualizarCola();
      }
    });

  $('#filtrosJuegos')
    .off('click', '.btn-console')
    .on('click', '.btn-console', function () {
      filtroJuegos = $(this).data('cat');

      $('#filtrosJuegos .btn-console')
        .removeClass('is-active')
        .attr('aria-pressed', 'false');
      $(this).addClass('is-active').attr('aria-pressed', 'true');

      renderJuegos();
    });

  $('#colaVaciar')
    .off('click')
    .on('click', function () {
      if (!colaJuegos.length) {
        mostrarToast('<strong>La cola ya está vacía</strong>Agregá juegos desde el catálogo.', 'error');
        return;
      }

      colaJuegos = [];
      actualizarCola();
      mostrarToast('<strong>Cola vaciada</strong>Elegí nuevos juegos cuando quieras.', 'ok');
    });

  $(document)
    .off('click', '#reintentarCatalogo')
    .on('click', '#reintentarCatalogo', cargarJuegos);

  actualizarCola();
  cargarJuegos();

  /* =======================================================
     4) SNACKS + RESUMEN EN VIVO
     ======================================================= */
  var snackState = {};
  var bumpTimer = null;

  var precios = {
    'PS5 Pro · Sala A': 12,
    'PS5 Slim · Sala B': 10,
    'Estación Nova': 8,
    'Estación Titan': 12,
    'Estación Pulse': 15
  };

  $('.snack').each(function () {
    snackState[$(this).data('id')] = 0;
  });

  function getSelectedSnacks() {
    var items = [];
    var total = 0;

    $('.snack').each(function () {
      var $snack = $(this);
      var id = $snack.data('id');
      var qty = snackState[id] || 0;
      var price = Number($snack.data('price')) || 0;

      if (qty > 0) {
        items.push({
          name: $snack.find('.snack__info h3').text(),
          qty: qty,
          price: price,
          subtotal: qty * price
        });
        total += qty * price;
      }
    });

    return { items: items, total: total };
  }

  function updateSnacks() {
    var items = 0;
    var total = 0;

    $('.snack').each(function () {
      var $snack = $(this);
      var id = $snack.data('id');
      var price = Number($snack.data('price')) || 0;
      var qty = snackState[id] || 0;

      items += qty;
      total += qty * price;

      $snack.find('[data-qty]').text(qty);
      $snack.toggleClass('is-selected', qty > 0);
      $snack.find('[data-action="minus"]').prop('disabled', qty === 0);
    });

    $('#snackCount').text(items);
    $('#snackTotal').text('Bs ' + total);

    var $summary = $('.snack-summary');
    $summary.addClass('is-bump');
    clearTimeout(bumpTimer);
    bumpTimer = setTimeout(function () {
      $summary.removeClass('is-bump');
    }, 260);

    updateResumen();
  }

  $('.qty-btn').on('click', function () {
    var $snack = $(this).closest('.snack');
    var id = $snack.data('id');
    var action = $(this).data('action');
    var qty = snackState[id] || 0;

    if (action === 'plus' && qty < 10) {
      snackState[id] = qty + 1;
    } else if (action === 'minus' && qty > 0) {
      snackState[id] = qty - 1;
    }

    updateSnacks();
  });

  /* =======================================================
     5) FECHAS + RESUMEN DE RESERVA
     ======================================================= */
  function fechaISO(fecha) {
    return fecha.getFullYear() + '-' +
      dosDigitos(fecha.getMonth() + 1) + '-' +
      dosDigitos(fecha.getDate());
  }

  function formatFecha(valor) {
    if (!valor) return '—';
    var partes = valor.split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : valor;
  }

  var hoy = new Date();
  var fechaMaxima = new Date();
  fechaMaxima.setDate(fechaMaxima.getDate() + 90);

  $('#fecha')
    .attr('min', fechaISO(hoy))
    .attr('max', fechaISO(fechaMaxima));

  /* Horario de atención: 14:00 a 23:00 (última entrada 22:00) */
  var APERTURA_MIN = 14 * 60;
  var CIERRE_MIN = 23 * 60;
  var MAX_HORAS = 6;

  function minutosDeHora(hora) {
    var partes = String(hora || '').split(':');
    if (partes.length !== 2) return NaN;

    var h = parseInt(partes[0], 10);
    var m = parseInt(partes[1], 10);
    if (isNaN(h) || isNaN(m)) return NaN;

    return h * 60 + m;
  }

  function horaMinimaHoy() {
    var ahora = new Date();
    var minutos = ahora.getHours() * 60 + ahora.getMinutes();

    if (minutos <= APERTURA_MIN) return '14:00';

    var siguiente = Math.ceil(minutos / 60) * 60;
    if (siguiente > CIERRE_MIN - 60) return null; // después de las 22:00

    return dosDigitos(siguiente / 60) + ':00';
  }

  function maxHorasPara(hora) {
    var inicio = minutosDeHora(hora);
    if (isNaN(inicio)) return MAX_HORAS;

    return Math.max(1, Math.min(MAX_HORAS, Math.floor((CIERRE_MIN - inicio) / 60)));
  }

  function actualizarMaxHoras() {
    var max = maxHorasPara($('#hora').val());
    var actual = parseInt($('#horas').val(), 10);

    $('#horas').attr('max', max);

    if (!isNaN(actual) && actual > max) {
      $('#horas').val(max).trigger('change');
      actual = max;
    }

    $('#horasMas').prop('disabled', !isNaN(actual) && actual >= max);
    $('#horasMenos').prop('disabled', !isNaN(actual) && actual <= 1);
  }

  function actualizarHorasDisponibles() {
    var ahora = new Date();
    var maxima = new Date();
    maxima.setDate(maxima.getDate() + 90);

    $('#fecha')
      .attr('min', fechaISO(ahora))
      .attr('max', fechaISO(maxima));

    var fecha = $('#fecha').val();
    var esHoy = fecha === fechaISO(ahora);
    var minima = esHoy ? horaMinimaHoy() : '14:00';

    $('#hora option').each(function () {
      if (!this.value) return;

      var disponible = minima !== null && this.value >= minima;
      this.disabled = !disponible;
    });

    if (esHoy) {
      var seleccion = $('#hora').val();

      if (minima === null || (seleccion && seleccion < minima)) {
        $('#hora').val('');
      }
    }

    actualizarMaxHoras();
  }

  function siguienteHorarioDisponible() {
    var minima = horaMinimaHoy();

    if (minima) {
      return { fecha: fechaISO(new Date()), hora: minima };
    }

    var manana = new Date();
    manana.setDate(manana.getDate() + 1);

    return { fecha: fechaISO(manana), hora: '14:00' };
  }

  $('#fecha').on('change', actualizarHorasDisponibles);
  $('#hora').on('change', actualizarMaxHoras);
  actualizarHorasDisponibles();

  function getTotales() {
    var estacion = $('#estacion').val() || '';
    var precio = precios[estacion] || 0;
    var horas = parseInt($('#horas').val(), 10);

    if (isNaN(horas) || horas < 0) horas = 0;

    var subtotalEstacion = precio * horas;
    var snacks = getSelectedSnacks();

    return {
      estacion: estacion,
      precio: precio,
      horas: horas,
      subtotalEstacion: subtotalEstacion,
      snacks: snacks.items,
      totalSnacks: snacks.total,
      total: subtotalEstacion + snacks.total
    };
  }

  function textoHoras(horas) {
    if (!horas) return '—';
    return horas + (horas === 1 ? ' hora' : ' horas');
  }

  function pintarListaSnacks($contenedor, items, claseVacia, textoVacio) {
    $contenedor.empty();

    if (!items.length) {
      $('<li>').addClass(claseVacia).text(textoVacio).appendTo($contenedor);
      return;
    }

    $.each(items, function (_, item) {
      $('<li>')
        .append($('<span>').text(item.qty + '× ' + item.name))
        .append($('<b>').text('Bs ' + item.subtotal))
        .appendTo($contenedor);
    });
  }

  function updateResumen() {
    var datos = getTotales();
    var personas = $('#personas').val();

    $('#resumenEstacion').text(datos.estacion || '—');
    $('#resumenFecha').text(formatFecha($('#fecha').val()));
    $('#resumenHora').text($('#hora').val() || '—');
    $('#resumenPersonas').text(
      personas ? personas + (personas === '1' ? ' persona' : ' personas') : '—'
    );
    $('#resumenHoras').text(textoHoras(datos.horas));
    $('#resumenPrecio').text('Bs ' + datos.precio);
    $('#resumenSubtotalEstacion').text('Bs ' + datos.subtotalEstacion);
    $('#resumenTotalSnacks').text('Bs ' + datos.totalSnacks);
    $('#resumenTotalGeneral').text('Bs ' + datos.total);
    $('#precioHoraVista').text('Bs ' + datos.precio + ' / hora');

    pintarListaSnacks(
      $('#resumenSnacksLista'),
      datos.snacks,
      'pedido__empty',
      'Sin snacks seleccionados.'
    );

    pintarListaSnacks(
      $('#pedidoSnacksLista'),
      datos.snacks,
      'pedido-lateral__empty',
      'Todavía no elegiste snacks.'
    );

    $('#pedidoSnacksTotal').text('Bs ' + datos.totalSnacks);

    /* Panel lateral del lobby */
    var totalItems = 0;
    $.each(datos.snacks, function (_, item) {
      totalItems += item.qty;
    });

    $('#sideEstacion').text(datos.estacion || 'Sin elegir');
    $('#sideHoras').text(textoHoras(datos.horas));
    $('#sideSnacks').text(totalItems + (totalItems === 1 ? ' ítem' : ' ítems'));
    $('#sideTotal').text('Bs ' + datos.total);

    $('#railSnackCount')
      .text(totalItems)
      .toggleClass('is-on', totalItems > 0);
  }

  updateSnacks();

  /* Horas: botones + / − y límite 1–6 según el horario elegido */
  function ajustarHoras(delta) {
    var actual = parseInt($('#horas').val(), 10);
    if (isNaN(actual)) actual = 1;

    var max = maxHorasPara($('#hora').val());
    var nuevo = Math.min(max, Math.max(1, actual + delta));

    $('#horas').val(nuevo).trigger('change');
    actualizarMaxHoras();
  }

  $('#horasMenos').on('click', function () {
    ajustarHoras(-1);
  });

  $('#horasMas').on('click', function () {
    ajustarHoras(1);
  });

  $('#horas').on('input', function () {
    var valor = parseInt(this.value, 10);
    var max = maxHorasPara($('#hora').val());

    if (!isNaN(valor)) {
      if (valor > max) this.value = max;
      if (valor < 1) this.value = 1;
    }

    actualizarMaxHoras();
  });

  /* Botón "Alquilar hora" de cada tarjeta */
  $('.btn-alquilar').on('click', function () {
    var estacion = $(this).data('estacion');
    var precio = Number($(this).data('precio')) || 0;
    var sugerencia = siguienteHorarioDisponible();

    $('#estacion').val(estacion).trigger('change');
    $('#horas').val(1).trigger('change');

    if (!$('#fecha').val()) {
      $('#fecha').val(sugerencia.fecha);
      $('#hora').val(sugerencia.hora);
    }

    actualizarHorasDisponibles();

    if (!$('#hora').val()) {
      var fecha = $('#fecha').val();
      var minima = fecha === fechaISO(new Date()) ? horaMinimaHoy() : '14:00';

      if (minima) {
        $('#hora').val(minima);
      } else {
        $('#fecha').val(sugerencia.fecha);
        actualizarHorasDisponibles();
        $('#hora').val(sugerencia.hora);
      }
    }

    actualizarMaxHoras();
    updateResumen();

    mostrarToast(
      '<strong>Estación seleccionada</strong>' +
      estacion + ' · Bs ' + precio + ' / hora',
      'ok'
    );

    abrirPanel('reserva');

    if (window.innerWidth > 900) {
      setTimeout(function () {
        $('#nombre').trigger('focus');
      }, 420);
    }
  });

  /* =======================================================
     6) VALIDACIÓN COMPLETA DEL FORMULARIO
     ======================================================= */
  var reglas = {
    nombre: function (valor) {
      if (!valor) return 'Ingresá tu nombre.';
      if (valor.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      if (valor.length > 40) return 'El nombre no puede pasar de 40 caracteres.';
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$/.test(valor)) return 'Usá solo letras y espacios.';
      return '';
    },
    celular: function (valor) {
      if (!valor) return 'Ingresá tu celular.';
      var limpio = valor.replace(/\D/g, '');
      if (!/^(?:591)?[0-9]{8}$/.test(limpio)) {
        return 'Ingresá 8 dígitos (o 591 + 8 dígitos). Solo números.';
      }
      return '';
    },
    estacion: function (valor) {
      return valor ? '' : 'Elegí una estación.';
    },
    horas: function (valor) {
      var numero = parseInt(valor, 10);
      var max = maxHorasPara($('#hora').val());

      if (!valor) return 'Indicá cuántas horas querés reservar.';
      if (isNaN(numero) || numero < 1 || numero > MAX_HORAS) return 'Elegí entre 1 y 6 horas.';
      if (String(numero) !== String(valor).trim()) return 'Usá un número entero de horas.';
      if (numero > max) {
        return 'Con ese horario el máximo es ' + max +
          (max === 1 ? ' hora' : ' horas') + ' (el local cierra a las 23:00).';
      }
      return '';
    },
    fecha: function (valor) {
      if (!valor) return 'Elegí una fecha.';

      var ahora = new Date();
      var max = new Date();
      max.setDate(max.getDate() + 90);

      if (valor < fechaISO(ahora)) return 'La fecha no puede ser anterior a hoy.';
      if (valor > fechaISO(max)) return 'Elegí una fecha dentro de los próximos 90 días.';
      return '';
    },
    hora: function (valor) {
      if (!valor) return 'Elegí una hora.';
      if (valor < '14:00' || valor > '22:00') return 'El horario de reservas es de 14:00 a 22:00.';

      if ($('#fecha').val() === fechaISO(new Date())) {
        var minima = horaMinimaHoy();

        if (!minima) {
          return 'Ya no quedan horarios disponibles para hoy. Elegí otra fecha.';
        }

        if (valor < minima) {
          return 'Para hoy el próximo horario disponible es ' + minima + '.';
        }
      }

      return '';
    },
    personas: function (valor) {
      var numero = parseInt(valor, 10);
      if (!numero || numero < 1 || numero > 6) return 'Elegí entre 1 y 6 personas.';
      return '';
    }
  };

  function valorCampo(nombre) {
    return $.trim(String($('#' + nombre).val() || ''));
  }

  function setFieldError(nombre, mensaje) {
    var $campo = $('#' + nombre);
    var $error = $('[data-error-for="' + nombre + '"]');

    $campo
      .toggleClass('is-invalid', Boolean(mensaje))
      .attr('aria-invalid', mensaje ? 'true' : 'false');

    $error
      .text(mensaje)
      .toggleClass('is-visible', Boolean(mensaje));

    return !mensaje;
  }

  function validarCampo(nombre) {
    var mensaje = reglas[nombre](valorCampo(nombre));
    return setFieldError(nombre, mensaje);
  }

  function validarFormulario() {
    var invalidos = [];

    $.each(reglas, function (nombre) {
      if (!validarCampo(nombre)) {
        invalidos.push(nombre);
      }
    });

    return invalidos;
  }

  /* Restricción de escritura:
     celular = solo dígitos · nombre = solo letras */
  $('#celular').on('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) return;
    if (event.key.length === 1 && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  });

  $('#celular').on('input', function () {
    var limpio = this.value.replace(/\D/g, '').slice(0, 11);
    if (this.value !== limpio) {
      this.value = limpio;
    }
  });

  $('#nombre').on('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) return;
    if (event.key.length === 1 && /[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  });

  $('#nombre').on('input', function () {
    var limpio = this.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g, '');
    if (this.value !== limpio) {
      this.value = limpio;
    }
  });

  /* =======================================================
     TOAST FLOTANTE
     ======================================================= */
  var toastTimer = null;

  /* Sanitiza el HTML de los toasts antes de inyectarlo con .html() */
  function sanitizarHtml(html) {
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(String(html), {
        ALLOWED_TAGS: ['strong', 'b', 'em', 'br', 'span'],
        ALLOWED_ATTR: []
      });
    }

    // Respaldo seguro si DOMPurify no cargó: muestra solo texto
    return $('<div>').text(String(html).replace(/<[^>]*>/g, '')).html();
  }

  function mostrarToast(mensaje, tipo) {
    var $toast = $('#toast');

    clearTimeout(toastTimer);
    $toast
      .stop(true, true)
      .removeClass('toast--ok toast--error')
      .addClass(tipo === 'error' ? 'toast--error' : 'toast--ok')
      .html(sanitizarHtml(mensaje))
      .slideDown(250);

    toastTimer = setTimeout(function () {
      $toast.fadeOut(300);
    }, 3000);
  }

  /* =======================================================
     MODAL + CONTADOR DE 30 SEGUNDOS
     ======================================================= */
  var cuentaTimer = null;
  var segundosRestantes = 30;
  var envioTimer = null;

  function actualizarCuenta() {
    var segundos = Math.max(segundosRestantes, 0);

    $('#modalTimer').text('00:' + (segundos < 10 ? '0' : '') + segundos);
    $('#modalProgress').css('width', ((segundos / 30) * 100) + '%');
    $('#modalTimerBox').toggleClass('is-urgent', segundos <= 10);
  }

  function detenerCuenta() {
    if (cuentaTimer) {
      clearInterval(cuentaTimer);
      cuentaTimer = null;
    }
  }

  function iniciarCuenta() {
    detenerCuenta();
    segundosRestantes = 30;
    actualizarCuenta();

    cuentaTimer = setInterval(function () {
      segundosRestantes--;
      actualizarCuenta();

      if (segundosRestantes <= 0) {
        detenerCuenta();
        cerrarModal();
        mostrarToast(
          '<strong>Tarifa Flash Expirada</strong>' +
          'El tiempo para confirmar terminó. Volvé a intentarlo.',
          'error'
        );
      }
    }, 1000);
  }

  function generarCodigoReserva() {
    var ahora = new Date();
    var base = String(ahora.getFullYear()).slice(-2) +
      dosDigitos(ahora.getMonth() + 1) +
      dosDigitos(ahora.getDate());
    var aleatorio = Math.floor(Math.random() * 900) + 100;

    return 'KG-' + base + '-' + aleatorio;
  }

  function resetModalVista() {
    if (envioTimer) {
      clearTimeout(envioTimer);
      envioTimer = null;
    }

    $('#modalConfirmacion').removeAttr('hidden').show();
    $('#modalEnviado').hide().attr('hidden', 'hidden');
    $('#modalReserva').attr('aria-labelledby', 'modalTitulo');
    $('#modalConfirmar')
      .prop('disabled', false)
      .removeAttr('aria-busy')
      .text('Enviar reserva');
    $('#modalCancelar').prop('disabled', false);
  }

  function enviarReservaSimulada() {
    if ($('#modalConfirmar').prop('disabled')) return;

    detenerCuenta();

    var datos = getTotales();
    var personas = $('#personas').val();
    var snacksCount = 0;

    $.each(datos.snacks, function (_, item) {
      snacksCount += item.qty;
    });

    $('#modalConfirmar')
      .prop('disabled', true)
      .attr('aria-busy', 'true')
      .text('Enviando…');
    $('#modalCancelar').prop('disabled', true);

    // Simula el envío al local sin backend
    envioTimer = setTimeout(function () {
      envioTimer = null;

      var ahora = new Date();
      var horaEnvio = dosDigitos(ahora.getHours()) + ':' + dosDigitos(ahora.getMinutes());

      $('#envioNombre').text($('#nombre').val() || 'Gamer');
      $('#envioEstado').text('Enviado ahora · ' + horaEnvio);
      $('#envioCodigo').text(generarCodigoReserva());
      $('#envioEstacion').text(datos.estacion || '—');
      $('#envioFecha').text(formatFecha($('#fecha').val()));
      $('#envioHora').text($('#hora').val() || '—');
      $('#envioPersonas').text(
        personas ? personas + (personas === '1' ? ' persona' : ' personas') : '—'
      );
      $('#envioHoras').text(textoHoras(datos.horas));
      $('#envioSnacks').text(
        datos.snacks.length
          ? snacksCount + (snacksCount === 1 ? ' ítem · ' : ' ítems · ') +
            'Bs ' + datos.totalSnacks
          : 'Sin snacks'
      );
      $('#envioTotal').text('Bs ' + datos.total);

      $('#modalConfirmacion').hide().attr('hidden', 'hidden');
      $('#modalEnviado').removeAttr('hidden').show();
      $('#modalReserva').attr('aria-labelledby', 'modalEnvioTitulo');
      $('#modalEnvioTitulo').trigger('focus');
    }, 850);
  }

  function abrirModal() {
    var datos = getTotales();

    resetModalVista();

    $('#modalEstacion').text(datos.estacion || '—');
    $('#modalFecha').text(formatFecha($('#fecha').val()));
    $('#modalHora').text($('#hora').val() || '—');
    $('#modalPersonas').text(
      $('#personas').val()
        ? $('#personas').val() + ($('#personas').val() === '1' ? ' persona' : ' personas')
        : '—'
    );
    $('#modalHoras').text(textoHoras(datos.horas));
    $('#modalPrecio').text('Bs ' + datos.precio + ' / hora');
    $('#modalSubtotal').text('Bs ' + datos.subtotalEstacion);
    $('#modalTotalSnacks').text('Bs ' + datos.totalSnacks);
    $('#modalTotal').text('Bs ' + datos.total);

    var $lista = $('#modalSnacksLista').empty();

    if (datos.snacks.length) {
      $.each(datos.snacks, function (_, item) {
        $('<li>')
          .append($('<span>').text(item.qty + '× ' + item.name))
          .append($('<b>').text('Bs ' + item.subtotal))
          .appendTo($lista);
      });
    } else {
      $('<li>')
        .addClass('modal__snacks-empty')
        .text('Sin snacks seleccionados.')
        .appendTo($lista);
    }

    $('#modalReserva').fadeIn(200).attr('aria-hidden', 'false');
    $('body').addClass('modal-open');
    $('#modalCerrar').trigger('focus');
    iniciarCuenta();
  }

  function cerrarModal() {
    detenerCuenta();

    if (envioTimer) {
      clearTimeout(envioTimer);
      envioTimer = null;
    }

    $('#modalReserva').fadeOut(200).attr('aria-hidden', 'true');
    $('body').removeClass('modal-open');
    resetModalVista();
  }

  $('#modalCerrar, #modalCancelar').on('click', cerrarModal);
  $('#modalBackdrop').on('click', cerrarModal);

  $(document).on('keydown', function (event) {
    if (event.key !== 'Escape') return;

    if ($('#modalReserva').is(':visible')) {
      cerrarModal();
    } else if (menuAbierto) {
      cerrarMenu(true);
    } else if (panelActual) {
      cerrarPaneles();
    }
  });

  $('#modalConfirmar').on('click', enviarReservaSimulada);

  $('#envioCerrar').on('click', cerrarModal);

  $('#envioNueva').on('click', function () {
    cerrarModal();
    $('#reservaForm').trigger('reset');
  });

  $('#reservaForm').on('submit', function (event) {
    event.preventDefault();

    var invalidos = validarFormulario();

    if (invalidos.length) {
      $('#formError')
        .text(invalidos.length === 1
          ? 'Revisá el campo marcado para continuar.'
          : 'Revisá los ' + invalidos.length + ' campos marcados para continuar.')
        .fadeIn(150);

      var $primero = $('#' + invalidos[0]);
      var $panelBody = $primero.closest('.panel__body');

      if ($panelBody.length) {
        var destino = $primero.offset().top - $panelBody.offset().top + $panelBody.scrollTop() - 80;
        $panelBody.stop(true).animate({ scrollTop: Math.max(destino, 0) }, 300);
      }

      $primero.trigger('focus');
      return;
    }

    $('#formError').hide().text('');
    updateResumen();
    abrirModal();
  });

  $('#reservaForm').on('input change', 'input, select', function () {
    updateResumen();

    if ($(this).hasClass('is-invalid')) {
      validarCampo(this.id);
    }

    if (!$('.field .is-invalid').length) {
      $('#formError').hide();
    }
  });

  $('#reservaForm').on('focusout', 'input, select', function () {
    if ($(this).val()) {
      validarCampo(this.id);
    }
  });

  $('#reservaForm').on('reset', function () {
    setTimeout(function () {
      $.each(reglas, function (nombre) {
        setFieldError(nombre, '');
      });

      $('#formError').hide().text('');
      $('#horas').val(1);
      actualizarHorasDisponibles();

      $.each(snackState, function (id) {
        snackState[id] = 0;
      });

      updateSnacks();
      updateResumen();
    }, 0);
  });

  /* =======================================================
     7) CARRUSEL DE IMÁGENES
     ======================================================= */
  var $slides = $('.slide');
  var totalSlides = $slides.length;
  var slideActual = 0;
  var autoplay = null;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#slideTotal').text(dosDigitos(totalSlides));

  $slides.each(function (indice) {
    $('<button>')
      .attr({
        type: 'button',
        class: 'carrusel__dot' + (indice === 0 ? ' is-active' : ''),
        'aria-label': 'Ir a la imagen ' + (indice + 1)
      })
      .on('click', function () {
        irASlide(indice);
        reiniciarAutoplay();
      })
      .appendTo('#carruselDots');
  });

  function actualizarCarrusel() {
    $('#slideActual').text(dosDigitos(slideActual + 1));

    $('.carrusel__dot')
      .removeClass('is-active')
      .eq(slideActual)
      .addClass('is-active');

    $('#carruselProgress').css(
      'width',
      (((slideActual + 1) / totalSlides) * 100) + '%'
    );

    $slides.each(function (indice) {
      $(this).attr('aria-hidden', indice === slideActual ? 'false' : 'true');
    });
  }

  function irASlide(indice) {
    var destino = (indice + totalSlides) % totalSlides;

    if (destino === slideActual) {
      actualizarCarrusel();
      return;
    }

    var $saliente = $slides.eq(slideActual).removeClass('is-active');
    var $entrante = $slides.eq(destino).addClass('is-active');

    $saliente.stop(true, true).fadeOut(280);
    $entrante.stop(true, true).fadeIn(420);

    slideActual = destino;
    actualizarCarrusel();
  }

  function detenerAutoplay() {
    if (autoplay) {
      clearInterval(autoplay);
      autoplay = null;
    }
  }

  function iniciarAutoplay() {
    if (reduceMotion || panelActual !== 'galeria') return;
    detenerAutoplay();
    autoplay = setInterval(function () {
      irASlide(slideActual + 1);
    }, 6000);
  }

  function reiniciarAutoplay() {
    detenerAutoplay();
    iniciarAutoplay();
  }

  $('#prevSlide').on('click', function () {
    irASlide(slideActual - 1);
    reiniciarAutoplay();
  });

  $('#nextSlide').on('click', function () {
    irASlide(slideActual + 1);
    reiniciarAutoplay();
  });

  $('#carrusel')
    .attr('tabindex', '0')
    .on('mouseenter focusin', detenerAutoplay)
    .on('mouseleave focusout', iniciarAutoplay)
    .on('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        irASlide(slideActual - 1);
        reiniciarAutoplay();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        irASlide(slideActual + 1);
        reiniciarAutoplay();
      }
    });

  actualizarCarrusel();
  iniciarAutoplay();

  /* =======================================================
     8) HIDRATACIÓN: API DE ESTADO PARA LA CAPA PWA
     ======================================================= */
  function obtenerEstado() {
    var snacks = {};

    $.each(snackState, function (id, qty) {
      if (qty > 0) snacks[id] = qty;
    });

    return {
      tema: $('body').hasClass('theme-light') ? 'light' : 'dark',
      snacks: snacks,
      cola: colaJuegos.slice(),
      reserva: {
        nombre: $('#nombre').val() || '',
        celular: $('#celular').val() || '',
        estacion: $('#estacion').val() || '',
        horas: $('#horas').val() || '',
        fecha: $('#fecha').val() || '',
        hora: $('#hora').val() || '',
        personas: $('#personas').val() || ''
      }
    };
  }

  function aplicarEstado(estado) {
    if (!estado || typeof estado !== 'object') return false;

    /* Tema: reutiliza el handler existente para actualizar ARIA y theme-color */
    if (estado.tema === 'light' && !$('body').hasClass('theme-light')) {
      $('#themeToggle').trigger('click');
    } else if (estado.tema === 'dark' && $('body').hasClass('theme-light')) {
      $('#themeToggle').trigger('click');
    }

    /* Snacks */
    if (estado.snacks && typeof estado.snacks === 'object') {
      $.each(snackState, function (id) {
        var qty = parseInt(estado.snacks[id], 10);
        snackState[id] = isNaN(qty) ? 0 : Math.min(10, Math.max(0, qty));
      });
      updateSnacks();
    }

    /* Cola de juegos: si el catálogo aún no cargó, queda pendiente */
    if (Array.isArray(estado.cola)) {
      var vistos = {};
      var cola = $.grep(estado.cola, function (id) {
        var key = String(id);
        if (vistos[key]) return false;
        vistos[key] = true;
        return true;
      });

      if (juegos.length) {
        colaJuegos = $.grep(cola, function (id) {
          return !!buscarJuego(String(id));
        });
        actualizarCola();
      } else {
        colaPendiente = cola;
      }
    }

    /* Borrador de reserva */
    if (estado.reserva && typeof estado.reserva === 'object') {
      var r = estado.reserva;

      if (typeof r.nombre === 'string') {
        $('#nombre').val(r.nombre.slice(0, 40));
      }

      if (typeof r.celular === 'string') {
        $('#celular').val(r.celular.replace(/\D/g, '').slice(0, 11));
      }

      if (r.estacion && Object.prototype.hasOwnProperty.call(precios, r.estacion)) {
        $('#estacion').val(r.estacion);
      }

      var horas = parseInt(r.horas, 10);
      if (!isNaN(horas)) {
        $('#horas').val(Math.min(MAX_HORAS, Math.max(1, horas)));
      }

      var ahora = new Date();
      var maxFecha = new Date();
      maxFecha.setDate(maxFecha.getDate() + 90);

      if (r.fecha && r.fecha >= fechaISO(ahora) && r.fecha <= fechaISO(maxFecha)) {
        $('#fecha').val(r.fecha);
      }

      if (r.hora) {
        $('#hora').val(r.hora);
      }

      var personas = parseInt(r.personas, 10);
      if (personas >= 1 && personas <= 6) {
        $('#personas').val(String(personas));
      }

      actualizarHorasDisponibles();
      actualizarMaxHoras();
      updateResumen();
    }

    return true;
  }

  window.KalizdyGame = {
    estado: obtenerEstado,
    aplicar: aplicarEstado,
    abrirPanel: abrirPanel
  };

  /* =======================================================
     9) PWA: REGISTRO DEL SERVICE WORKER
     ======================================================= */
  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('sw.js')
        .then(function (registro) {
          console.info('Service Worker activo:', registro.scope);
        })
        .catch(function (error) {
          console.warn('Service Worker no registrado:', error);
        });
    });
  }

  console.log('%cKalizdy Game · sistema listo 🎮', 'color:#00e5ff;font-weight:bold');
});
