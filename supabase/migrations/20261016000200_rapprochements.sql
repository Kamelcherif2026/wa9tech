-- =====================================================================
-- WA9TECH — Migration 7 : rapprochements pour l'import d'affiches (IA)
-- Retrouve la ville, le lieu et les doublons à partir du texte lu par l'IA.
-- =====================================================================

-- Ville : correspondance exacte (FR, AR, slug), sinon la plus proche
create or replace function public.rapprocher_ville(p_nom text)
returns smallint
language sql stable
set search_path = public, extensions
as $$
  with q as (select public.normaliser(p_nom) as n)
  select v.id
    from public.ville v, q
   where q.n <> ''
     and (public.normaliser(v.nom_fr) = q.n
          or public.normaliser(v.nom_ar) = q.n
          or v.slug = public.slugifier(p_nom)
          or similarity(public.normaliser(v.nom_fr), q.n) > 0.5
          or word_similarity(public.normaliser(v.nom_fr), q.n) > 0.8)
   order by (public.normaliser(v.nom_fr) = q.n or public.normaliser(v.nom_ar) = q.n) desc,
            similarity(public.normaliser(v.nom_fr), q.n) desc,
            length(v.nom_fr) desc
   limit 1;
$$;

-- Lieu : nom proche (dans un sens ou dans l'autre), bonus si même ville
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
             coalesce(word_similarity(q.n, public.normaliser(l.nom_ar)), 0)
           ) as s
      from public.lieu l, q
     where l.actif and q.n <> ''
  )
  select c.id, c.nom, (c.s + case when c.ville_id = p_ville_id then 0.1 else 0 end)::real
    from c
   where c.s >= 0.55
   order by 3 desc
   limit 1;
$$;

-- Doublons : même jour (heure de Tunis) et titre proche
create or replace function public.chercher_doublon(p_titre text, p_dates date[])
returns table (id uuid, titre_fr text, score real)
language sql stable
set search_path = public, extensions
as $$
  select e.id, e.titre_fr,
         greatest(similarity(e.titre_norm, public.normaliser(p_titre)),
                  word_similarity(public.normaliser(p_titre), e.titre_norm))::real
    from public.evenement e
   where e.statut not in ('rejete', 'archive')
     and exists (select 1 from public.representation r
                  where r.evenement_id = e.id
                    and (r.debut at time zone 'Africa/Tunis')::date = any (p_dates))
     and greatest(similarity(e.titre_norm, public.normaliser(p_titre)),
                  word_similarity(public.normaliser(p_titre), e.titre_norm)) > 0.4
   order by 3 desc
   limit 1;
$$;
