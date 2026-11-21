-- Limpieza de la reserva de prueba creada el 21/11/2026
-- Ejecutar en Supabase → SQL Editor si querés borrar el registro de prueba.

delete from public.reserva_snacks
where reserva_id in (
  select id from public.reservas
  where codigo = 'KG-261121-1161' or nombre = 'PRUEBA SISTEMA'
);

delete from public.reservas
where codigo = 'KG-261121-1161' or nombre = 'PRUEBA SISTEMA';

-- Verificación: debe devolver 0
select count(*) as pruebas_restantes
from public.reservas
where codigo = 'KG-261121-1161' or nombre = 'PRUEBA SISTEMA';
