-- =====================================================================
-- Import IA : rattachement automatique du lieu, plus sûr.
-- - Un lieu d'une autre ville que celle lue sur l'affiche est pénalisé
--   (évite « Théâtre de Hammamet » → « Théâtre de l'Opéra de Tunis »).
-- - Seuil relevé à 0,7 ; le nom le plus ressemblant départage.
-- - Nom ambigu (plusieurs lieux presque à égalité, ex. « Maison de la culture »
--   à Sfax ou « Cité de la Culture » seule) : pas de rattachement, le lieu
--   reste à choisir dans le back-office (alerte « lieu »).
-- - Rattrapage : les événements déjà importés avec une adresse libre sont
--   rattachés à leur lieu quand la correspondance est sûre (score ≥ 0,8).
-- =====================================================================

create or replace function public.rapprocher_lieu(p_nom text, p_ville_id smallint default null)
returns table (id uuid, nom text, score real)
language sql stable
set search_path = public, extensions
as $$
  with q as (select public.normaliser(p_nom) as n),
  c as (
    select l.id, l.nom, l.ville_id,
           greatest(
             similarity(public.normaliser(l.nom), q.n),
             word_similarity(q.n, public.normaliser(l.nom)),
             word_similarity(public.normaliser(l.nom), q.n),
             coalesce(word_similarity(q.n, public.normaliser(l.nom_ar)), 0),
             coalesce(word_similarity(public.normaliser(l.nom_ar), q.n), 0)
           ) as s,
           similarity(public.normaliser(l.nom), q.n) as departage
      from public.lieu l, q
     where l.actif and q.n <> ''
  ),
  notes as (
    select c.id, c.nom,
           (c.s + case when p_ville_id is null then 0
                       when c.ville_id = p_ville_id then 0.1
                       else -0.25 end)::real as score,
           c.departage
      from c
  ),
  classes as (
    select n.*, n.score + 0.3 * n.departage as cle,
           row_number() over (order by n.score + 0.3 * n.departage desc, length(n.nom)) as rang
      from notes n
     where n.score >= 0.7
  )
  -- Le meilleur, seulement s'il se détache du deuxième : un nom générique
  -- (« Maison de la culture ») qui convient à plusieurs lieux reste à choisir à la main.
  select p.id, p.nom, p.score
    from classes p
    left join classes d on d.rang = 2
   where p.rang = 1
     and (d.id is null or p.cle - d.cle >= 0.05);
$$;

-- Rattrapage des événements existants (adresse libre → lieu référencé)
update public.evenement e
   set lieu_id = r.id,
       lieu_texte = null
  from (
    select e2.id as evenement_id, (select x.id from public.rapprocher_lieu(e2.lieu_texte, e2.ville_id) x where x.score >= 0.8) as id
      from public.evenement e2
     where e2.lieu_id is null
       and coalesce(e2.lieu_texte, '') <> ''
       and e2.statut not in ('rejete', 'archive')
  ) r
 where e.id = r.evenement_id
   and r.id is not null;
