-- Juegos iniciales de Kalizdy Game
insert into public.juegos
  (id, titulo, plataforma, genero, jugadores, portada, activo, orden)
values
  ('fc-26', 'EA Sports FC 26', 'PS5', 'Deportes', '1–4 jugadores', 'ps5.webp', true, 1),
  ('spider-man-2', 'Spider-Man 2', 'PS5', 'Acción / Aventura', '1 jugador', 'ps5-setup.webp', true, 2),
  ('mortal-kombat-1', 'Mortal Kombat 1', 'PS5', 'Peleas', '1–2 jugadores', 'ps5.webp', true, 3),
  ('elden-ring', 'Elden Ring', 'PS5', 'RPG / Soulslike', '1 jugador', 'hero.webp', true, 4),
  ('gran-turismo-7', 'Gran Turismo 7', 'PS5', 'Carreras', '1–2 jugadores', 'ps5-setup.webp', true, 5),
  ('street-fighter-6', 'Street Fighter 6', 'PS5', 'Peleas', '1–2 jugadores', 'torneos.webp', true, 6),
  ('god-of-war', 'God of War Ragnarök', 'PS5', 'Acción / Aventura', '1 jugador', 'ps5.webp', true, 7),
  ('tekken-8', 'Tekken 8', 'PS5', 'Peleas', '1–2 jugadores', 'torneos.webp', true, 8),
  ('warzone', 'Call of Duty: Warzone', 'PC', 'Battle Royale', 'Online', 'torneos.webp', true, 9),
  ('valorant', 'Valorant', 'PC', 'Shooter táctico', 'Online 5v5', 'pc.webp', true, 10),
  ('cs2', 'Counter-Strike 2', 'PC', 'Shooter táctico', 'Online 5v5', 'torneos.webp', true, 11),
  ('lol', 'League of Legends', 'PC', 'MOBA', 'Online 5v5', 'pc.webp', true, 12),
  ('apex', 'Apex Legends', 'PC', 'Battle Royale', 'Online', 'hero.webp', true, 13),
  ('fortnite', 'Fortnite', 'PC', 'Battle Royale', 'Online', 'hero.webp', true, 14),
  ('rocket-league', 'Rocket League', 'PC', 'Deportes', 'Online 3v3', 'pc.webp', true, 15)
on conflict (id) do update set
  titulo = excluded.titulo,
  plataforma = excluded.plataforma,
  genero = excluded.genero,
  jugadores = excluded.jugadores,
  portada = excluded.portada,
  orden = excluded.orden,
  activo = true;
