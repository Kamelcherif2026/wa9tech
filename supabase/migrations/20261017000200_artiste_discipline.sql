-- =====================================================================
-- WA9TECH — Discipline principale d'un artiste (musique, théâtre, danse…)
-- Sert à l'affichage (icône, couleur) quand l'artiste n'a pas encore d'événement.
-- =====================================================================

alter table public.artiste
  add column discipline_id smallint references public.categorie (id);
