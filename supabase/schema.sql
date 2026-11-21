-- =========================================================
-- KALIZDY GAME — ESQUEMA SUPABASE
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------- Catálogo ----------
create table if not exists public.estaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null check (tipo in ('PS5', 'PC')),
  precio_hora numeric(10, 2) not null check (precio_hora >= 0),
  descripcion text,
  activa boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.juegos (
  id text primary key,
  titulo text not null,
  plataforma text not null,
  genero text,
  jugadores text,
  portada text,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.snacks (
  id text primary key,
  nombre text not null,
  descripcion text,
  precio numeric(10, 2) not null check (precio >= 0),
  icono text,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

-- ---------- Reservas ----------
create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  idempotencia uuid unique,
  nombre text not null,
  celular text not null,
  estacion_id uuid not null references public.estaciones(id),
  estacion_nombre text not null,
  fecha date not null,
  hora time not null,
  horas integer not null check (horas between 1 and 6),
  personas integer not null check (personas between 1 and 6),
  precio_hora numeric(10, 2) not null,
  subtotal_estacion numeric(10, 2) not null,
  total_snacks numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmada', 'cancelada', 'completada')),
  usuario_id uuid references auth.users(id) on delete set null,
  inicio timestamp generated always as (fecha + hora) stored,
  fin timestamp generated always as
    (fecha + hora + make_interval(hours => horas)) stored,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint reservas_horario check (hora >= time '14:00' and hora <= time '22:00'),
  constraint reservas_cierre check (fin <= (fecha + time '23:00'))
);

create table if not exists public.reserva_snacks (
  id bigint generated always as identity primary key,
  reserva_id uuid not null references public.reservas(id) on delete cascade,
  snack_id text not null,
  nombre text not null,
  cantidad integer not null check (cantidad between 1 and 10),
  precio_unitario numeric(10, 2) not null,
  subtotal numeric(10, 2) not null
);

-- Evita dos reservas activas en la misma estación y horario
alter table public.reservas drop constraint if exists reservas_sin_solape;
alter table public.reservas
  add constraint reservas_sin_solape
  exclude using gist (
    estacion_nombre with =,
    tsrange(inicio, fin, '[)') with &&
  ) where (estado in ('pendiente', 'confirmada'));

-- ---------- Perfiles / administración ----------
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'admin' check (rol in ('admin', 'staff')),
  creado_en timestamptz not null default now()
);

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where user_id = auth.uid() and rol = 'admin'
  );
$$;

-- ---------- RPC de reserva ----------
create or replace function public.crear_reserva(
  p_nombre text,
  p_celular text,
  p_estacion text,
  p_fecha date,
  p_hora time,
  p_horas integer,
  p_personas integer,
  p_snacks jsonb default '[]'::jsonb,
  p_idempotencia uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_celular text := regexp_replace(coalesce(p_celular, ''), '[^0-9]', '', 'g');
  v_estacion public.estaciones%rowtype;
  v_snack public.snacks%rowtype;
  v_existente public.reservas%rowtype;
  v_ahora timestamp := (now() at time zone 'America/La_Paz');
  v_hoy date;
  v_minutos integer;
  v_siguiente integer;
  v_min time;
  v_item jsonb;
  v_cantidad integer;
  v_total_snacks numeric(10, 2) := 0;
  v_subtotal numeric(10, 2);
  v_codigo text;
  v_id uuid;
begin
  v_hoy := v_ahora::date;

  if length(v_nombre) < 3 or length(v_nombre) > 40
     or v_nombre !~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'' .-]+$' then
    raise exception 'Ingresá un nombre válido.' using errcode = 'P0001';
  end if;

  if v_celular !~ '^(591)?[0-9]{8}$' then
    raise exception 'Ingresá 8 dígitos o 591 + 8 dígitos.' using errcode = 'P0001';
  end if;

  if p_fecha is null or p_fecha < v_hoy then
    raise exception 'La fecha no puede ser anterior a hoy.' using errcode = 'P0001';
  end if;

  if p_fecha > (v_hoy + 90) then
    raise exception 'Elegí una fecha dentro de los próximos 90 días.' using errcode = 'P0001';
  end if;

  if p_hora is null or p_hora < time '14:00' or p_hora > time '22:00' then
    raise exception 'El horario de reservas es de 14:00 a 22:00.' using errcode = 'P0001';
  end if;

  if p_horas is null or p_horas < 1 or p_horas > 6 then
    raise exception 'Elegí entre 1 y 6 horas.' using errcode = 'P0001';
  end if;

  if (extract(epoch from p_hora) + p_horas * 3600) >
     extract(epoch from time '23:00') then
    raise exception 'La reserva no puede terminar después de las 23:00.' using errcode = 'P0001';
  end if;

  if p_personas is null or p_personas < 1 or p_personas > 6 then
    raise exception 'Elegí entre 1 y 6 personas.' using errcode = 'P0001';
  end if;

  if p_fecha = v_hoy then
    v_minutos := extract(hour from v_ahora)::int * 60 + extract(minute from v_ahora)::int;

    if v_minutos <= 840 then
      v_min := time '14:00';
    else
      v_siguiente := (ceil(v_minutos / 60.0) * 60)::int;
      if v_siguiente > 1320 then
        v_min := null;
      else
        v_min := make_time((v_siguiente / 60)::int, 0, 0);
      end if;
    end if;

    if v_min is null then
      raise exception 'Ya no quedan horarios disponibles para hoy. Elegí otra fecha.'
        using errcode = 'P0001';
    end if;

    if p_hora < v_min then
      raise exception 'Para hoy el próximo horario disponible es %.', to_char(v_min, 'HH24:MI')
        using errcode = 'P0001';
    end if;
  end if;

  select * into v_estacion
  from public.estaciones
  where nombre = p_estacion and activa = true;

  if not found then
    raise exception 'La estación elegida no está disponible.' using errcode = 'P0001';
  end if;

  if p_idempotencia is not null then
    select * into v_existente
    from public.reservas
    where idempotencia = p_idempotencia;

    if found then
      return jsonb_build_object(
        'id', v_existente.id,
        'codigo', v_existente.codigo,
        'estado', v_existente.estado,
        'estacion', v_existente.estacion_nombre,
        'fecha', v_existente.fecha,
        'hora', v_existente.hora,
        'horas', v_existente.horas,
        'personas', v_existente.personas,
        'total', v_existente.total
      );
    end if;
  end if;

  if p_snacks is null or jsonb_typeof(p_snacks) <> 'array' then
    raise exception 'Formato de snacks inválido.' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_snacks) loop
    v_cantidad := coalesce((v_item ->> 'cantidad')::int, 0);

    if v_cantidad < 0 or v_cantidad > 10 then
      raise exception 'Cada snack admite hasta 10 unidades.' using errcode = 'P0001';
    end if;

    if v_cantidad > 0 then
      select * into v_snack
      from public.snacks
      where id = (v_item ->> 'id') and activo = true;

      if not found then
        raise exception 'Uno de los snacks ya no está disponible.' using errcode = 'P0001';
      end if;

      v_total_snacks := v_total_snacks + (v_snack.precio * v_cantidad);
    end if;
  end loop;

  v_subtotal := v_estacion.precio_hora * p_horas;

  loop
    v_codigo := 'KG-' || to_char(v_ahora, 'YYMMDD') || '-' ||
      lpad((floor(random() * 10000))::int::text, 4, '0');

    exit when not exists (select 1 from public.reservas where codigo = v_codigo);
  end loop;

  insert into public.reservas (
    codigo, idempotencia, nombre, celular, estacion_id, estacion_nombre,
    fecha, hora, horas, personas, precio_hora, subtotal_estacion,
    total_snacks, total, estado, usuario_id
  ) values (
    v_codigo, p_idempotencia, v_nombre, v_celular, v_estacion.id, v_estacion.nombre,
    p_fecha, p_hora, p_horas, p_personas, v_estacion.precio_hora, v_subtotal,
    v_total_snacks, v_subtotal + v_total_snacks, 'pendiente', auth.uid()
  )
  returning id into v_id;

  for v_item in select value from jsonb_array_elements(p_snacks) loop
    v_cantidad := coalesce((v_item ->> 'cantidad')::int, 0);

    if v_cantidad > 0 then
      select * into v_snack
      from public.snacks
      where id = (v_item ->> 'id') and activo = true;

      insert into public.reserva_snacks (
        reserva_id, snack_id, nombre, cantidad, precio_unitario, subtotal
      ) values (
        v_id, v_snack.id, v_snack.nombre, v_cantidad,
        v_snack.precio, v_snack.precio * v_cantidad
      );
    end if;
  end loop;

  return jsonb_build_object(
    'id', v_id,
    'codigo', v_codigo,
    'estado', 'pendiente',
    'estacion', v_estacion.nombre,
    'fecha', p_fecha,
    'hora', p_hora,
    'horas', p_horas,
    'personas', p_personas,
    'total', v_subtotal + v_total_snacks
  );

exception
  when exclusion_violation then
    raise exception 'Ese horario ya está reservado para esa estación.' using errcode = 'P0001';
  when unique_violation then
    raise exception 'No se pudo generar la reserva. Intentá nuevamente.' using errcode = 'P0001';
end;
$$;

-- ---------- RLS ----------
alter table public.estaciones enable row level security;
alter table public.juegos enable row level security;
alter table public.snacks enable row level security;
alter table public.reservas enable row level security;
alter table public.reserva_snacks enable row level security;
alter table public.perfiles enable row level security;

drop policy if exists "estaciones catalogo publico" on public.estaciones;
create policy "estaciones catalogo publico" on public.estaciones
  for select to anon, authenticated using (activa = true);

drop policy if exists "juegos catalogo publico" on public.juegos;
create policy "juegos catalogo publico" on public.juegos
  for select to anon, authenticated using (activo = true);

drop policy if exists "snacks catalogo publico" on public.snacks;
create policy "snacks catalogo publico" on public.snacks
  for select to anon, authenticated using (activo = true);

drop policy if exists "estaciones admin" on public.estaciones;
create policy "estaciones admin" on public.estaciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "juegos admin" on public.juegos;
create policy "juegos admin" on public.juegos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "snacks admin" on public.snacks;
create policy "snacks admin" on public.snacks
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "reservas admin lectura" on public.reservas;
create policy "reservas admin lectura" on public.reservas
  for select to authenticated using (public.es_admin());

drop policy if exists "reservas admin actualizar" on public.reservas;
create policy "reservas admin actualizar" on public.reservas
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "reserva snacks admin" on public.reserva_snacks;
create policy "reserva snacks admin" on public.reserva_snacks
  for select to authenticated using (public.es_admin());

drop policy if exists "perfil propio" on public.perfiles;
create policy "perfil propio" on public.perfiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "perfiles admin" on public.perfiles;
create policy "perfiles admin" on public.perfiles
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------- Permisos ----------
grant usage on schema public to anon, authenticated;
grant select on public.estaciones, public.juegos, public.snacks to anon, authenticated;
grant insert, update, delete on public.estaciones, public.juegos, public.snacks to authenticated;
grant select, update on public.reservas to authenticated;
grant select on public.reserva_snacks to authenticated;
grant select on public.perfiles to authenticated;
grant execute on function public.es_admin() to authenticated;

revoke all on function public.crear_reserva(
  text, text, text, date, time, integer, integer, jsonb, uuid
) from public;
grant execute on function public.crear_reserva(
  text, text, text, date, time, integer, integer, jsonb, uuid
) to anon, authenticated;

-- ---------- Semillas del catálogo ----------
insert into public.estaciones (nombre, tipo, precio_hora, descripcion, orden) values
  ('PS5 Pro · Sala A', 'PS5', 12, '4K a 120 Hz, dos controles DualSense y sofá para dos.', 1),
  ('PS5 Slim · Sala B', 'PS5', 10, 'Setup compacto para partidas rápidas con amigos.', 2),
  ('Estación Nova', 'PC', 8, 'La entrada al competitivo: fluido y listo para ranked.', 3),
  ('Estación Titan', 'PC', 12, 'Potencia extra para shooters y battle royale.', 4),
  ('Estación Pulse', 'PC', 15, 'El setup de los que no aceptan ni un frame de lag.', 5)
on conflict (nombre) do update set
  tipo = excluded.tipo,
  precio_hora = excluded.precio_hora,
  descripcion = excluded.descripcion,
  orden = excluded.orden,
  activa = true;

insert into public.snacks (id, nombre, descripcion, precio, icono, orden) values
  ('combo-gamer-1', 'Combo Gamer 1', 'Hamburguesa + refresco', 18, '🍔', 1),
  ('combo-gamer-2', 'Combo Gamer 2', 'Hamburguesa + papas + refresco', 24, '🍟', 2),
  ('combo-gamer-3', 'Combo Gamer 3', 'Alitas + papas + refresco', 30, '🍗', 3),
  ('nachos', 'Nachos Kalizdy', 'Queso, jalapeños y guacamole', 12, '🧀', 4),
  ('refresco', 'Refresco', 'Vaso grande con hielo', 5, '🥤', 5),
  ('cafe', 'Café', 'Caliente o frío, para la madrugada', 3, '☕', 6)
on conflict (id) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  precio = excluded.precio,
  icono = excluded.icono,
  orden = excluded.orden,
  activo = true;

-- Los juegos se insertan desde la app (seed generado con data/juegos.json)
-- Ver supabase/seed-juegos.sql

-- ---------- Nota de administración ----------
-- Después de crear el usuario admin en Supabase Auth:
-- insert into public.perfiles (user_id, rol)
-- select id, 'admin' from auth.users where email = 'TU_CORREO_ADMIN';
