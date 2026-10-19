-- =====================================================================
-- Carte « Autour de moi » (application mobile) : evenements_proches renvoie
-- aussi le lieu (slug, nom arabe, coordonnées) et la ville, pour poser les
-- épingles sur la carte et ouvrir la page du lieu.
-- Le type de retour change : il faut supprimer puis recréer la fonction.
-- Mêmes paramètres et même filtre qu'avant (publiés, représentations non
-- annulées, rayon de 1 à 100 km, 100 résultats au plus).
-- =====================================================================

drop function if exists public.evenements_proches(double precision, double precision, int, timestamptz, timestamptz, int);

create function public.evenements_proches(
  p_lat       double precision,
  p_lng       double precision,
  p_rayon_km  int         default 25,
  p_debut     timestamptz default now(),
  p_fin       timestamptz default null,
  p_limite    int         default 30
)
returns table (
  id uuid, slug text, titre_fr text, titre_ar text, image text,
  categorie_id smallint, lieu_nom text, prochaine_date timestamptz,
  gratuit boolean, distance_km double precision,
  lieu_slug text, lieu_nom_ar text, lat double precision, lng double precision, ville_id smallint
)
language sql stable
set search_path = public, extensions
as $$
  with pt as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  )
  select e.id, e.slug, e.titre_fr, e.titre_ar, e.images[1], e.categorie_id, l.nom,
         e.prochaine_date, e.gratuit,
         round((st_distance(l.position, (select g from pt)) / 1000)::numeric, 1)::double precision,
         l.slug, l.nom_ar, l.lat, l.lng, l.ville_id
    from public.evenement e
    join public.lieu l on l.id = e.lieu_id
   where e.statut = 'publie'
     and l.position is not null
     and st_dwithin(l.position, (select g from pt), least(greatest(p_rayon_km, 1), 100) * 1000)
     and exists (
           select 1 from public.representation r
            where r.evenement_id = e.id and not r.annulee
              and coalesce(r.fin, r.debut + interval '3 hours') >= coalesce(p_debut, now())
              and (p_fin is null or r.debut <= p_fin))
   order by 10 asc, e.prochaine_date asc
   limit least(greatest(p_limite, 1), 100);
$$;

comment on function public.evenements_proches is
  'Événements publiés à venir autour d''un point (carte « Autour de moi »), du plus proche au plus lointain.';
