-- =====================================================================
-- WA9TECH — Migration 5 : coordonnées lisibles des lieux
-- La colonne `position` (geography) est illisible via l'API (format binaire).
-- On expose lat / lng en colonnes générées, en lecture seule.
-- Écriture : envoyer position = 'SRID=4326;POINT(lng lat)'.
-- =====================================================================

alter table public.lieu
  add column lat double precision
    generated always as (extensions.st_y(position::extensions.geometry)) stored,
  add column lng double precision
    generated always as (extensions.st_x(position::extensions.geometry)) stored;
