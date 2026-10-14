-- =====================================================================
-- WA9TECH — Migration 2 : fonctions, triggers et API (RPC)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Normalisation du texte (FR + AR + derja) pour la recherche
--   - minuscules, sans accents
--   - أ إ آ ٱ → ا ; ة → ه ; ى → ي
--   - suppression du tashkil et du tatweel
-- ---------------------------------------------------------------------
create or replace function public.normaliser(t text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select regexp_replace(
           translate(lower(extensions.unaccent('extensions.unaccent', coalesce(t, ''))),
                     'أإآٱةى', 'ااااهي'),
           '[ً-ْـ]', '', 'g');
$$;

-- Slug lisible (caractères latins) ; renvoie '' si le texte est entièrement en arabe
create or replace function public.slugifier(t text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select trim(both '-' from
           regexp_replace(lower(extensions.unaccent('extensions.unaccent', coalesce(t, ''))),
                          '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------
-- Rôles : helpers utilisés par la RLS
-- ---------------------------------------------------------------------
create or replace function public.role_courant()
returns public.role_utilisateur
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profil p where p.id = auth.uid()),
    'public'::public.role_utilisateur);
$$;

create or replace function public.est_staff()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.role_courant() in ('moderateur', 'admin');
$$;

create or replace function public.mon_organisateur()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.organisateur_id from public.profil p where p.id = auth.uid();
$$;

create or replace function public.est_appel_interne()
returns boolean
language sql stable
set search_path = ''
as $$
  -- Vrai pour les Edge Functions (clé service_role) et les appels SQL directs
  -- (pg_cron, console SQL) ; faux pour les appels anon / authenticated via l'API.
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
                  'interne') in ('service_role', 'interne');
$$;

-- ---------------------------------------------------------------------
-- Profil créé automatiquement à l'inscription
-- ---------------------------------------------------------------------
create or replace function public.creer_profil()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profil (id, nom)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.creer_profil();

-- ---------------------------------------------------------------------
-- Slugs automatiques (lieu, organisateur, artiste, film, ville)
--   TG_ARGV[0] = colonne source du slug
-- ---------------------------------------------------------------------
create or replace function public.remplir_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
begin
  if new.slug is null or new.slug = '' then
    base := public.slugifier(to_jsonb(new) ->> tg_argv[0]);
    if base = '' then base := tg_table_name; end if;
    new.slug := base || '-' || substr(md5(random()::text), 1, 5);
  end if;
  return new;
end;
$$;

create trigger slug_lieu before insert on public.lieu
  for each row execute function public.remplir_slug('nom');
create trigger slug_organisateur before insert on public.organisateur
  for each row execute function public.remplir_slug('nom');
create trigger slug_artiste before insert on public.artiste
  for each row execute function public.remplir_slug('nom');
create trigger slug_film before insert on public.film
  for each row execute function public.remplir_slug('titre');

create or replace function public.lieu_normaliser()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nom_norm := public.normaliser(concat_ws(' ', new.nom, new.nom_ar));
  return new;
end;
$$;

create trigger lieu_norm before insert or update of nom, nom_ar on public.lieu
  for each row execute function public.lieu_normaliser();

-- ---------------------------------------------------------------------
-- Événement : slug, ville déduite du lieu, index de recherche,
-- protection des champs réservés au staff
-- ---------------------------------------------------------------------
create or replace function public.evenement_avant_ecriture()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_lieu  text;
  v_ville text;
  v_arts  text;
begin
  -- Slug : titre + id court (stable, unique)
  if tg_op = 'INSERT' and (new.slug is null or new.slug = '') then
    new.slug := nullif(public.slugifier(new.titre_fr), '');
    new.slug := coalesce(new.slug || '-', 'evenement-') || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  -- Ville déduite du lieu si non renseignée
  if new.lieu_id is not null and new.ville_id is null then
    select l.ville_id into new.ville_id from public.lieu l where l.id = new.lieu_id;
  end if;

  -- Champs réservés au staff (les appels « service_role » des Edge Functions passent)
  if current_user in ('anon', 'authenticated') and not public.est_staff() then
    if tg_op = 'INSERT' then
      new.verifie  := false;
      new.featured := false;
    else
      new.verifie  := old.verifie;
      new.featured := old.featured;
      new.publie_le := old.publie_le;
    end if;
  end if;

  -- Index de recherche
  select concat_ws(' ', l.nom, l.nom_ar), concat_ws(' ', v.nom_fr, v.nom_ar)
    into v_lieu, v_ville
    from public.lieu l join public.ville v on v.id = l.ville_id
   where l.id = new.lieu_id;
  if v_ville is null and new.ville_id is not null then
    select concat_ws(' ', v.nom_fr, v.nom_ar) into v_ville from public.ville v where v.id = new.ville_id;
  end if;
  if tg_op = 'UPDATE' then
    select string_agg(concat_ws(' ', a.nom, a.nom_ar), ' ') into v_arts
      from public.evenement_artiste ea join public.artiste a on a.id = ea.artiste_id
     where ea.evenement_id = new.id;
  end if;

  new.titre_norm := public.normaliser(concat_ws(' ', new.titre_fr, new.titre_ar));
  new.recherche :=
       setweight(to_tsvector('simple', new.titre_norm), 'A')
    || setweight(to_tsvector('simple', public.normaliser(v_arts)), 'A')
    || setweight(to_tsvector('simple', public.normaliser(concat_ws(' ', v_lieu, new.lieu_texte, v_ville))), 'B')
    || setweight(to_tsvector('simple', public.normaliser(concat_ws(' ', new.description_fr, new.description_ar))), 'C');

  new.modifie_le := now();
  return new;
end;
$$;

create trigger evenement_avant_ecriture
  before insert or update on public.evenement
  for each row execute function public.evenement_avant_ecriture();

-- Ajout / retrait d'un artiste → réindexation
create or replace function public.evenement_artiste_reindex()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.evenement set modifie_le = now()
   where id = coalesce(new.evenement_id, old.evenement_id);
  return null;
end;
$$;

create trigger evenement_artiste_reindex
  after insert or delete on public.evenement_artiste
  for each row execute function public.evenement_artiste_reindex();

-- ---------------------------------------------------------------------
-- prochaine_date : recalculée à chaque changement de représentation
-- ---------------------------------------------------------------------
create or replace function public.calculer_prochaine_date(p_evenement uuid)
returns timestamptz
language sql stable
set search_path = ''
as $$
  -- Prochaine représentation non annulée qui n'est pas encore terminée
  -- (fin connue, sinon début + 3 h)
  select min(r.debut)
    from public.representation r
   where r.evenement_id = p_evenement
     and not r.annulee
     and coalesce(r.fin, r.debut + interval '3 hours') > now();
$$;

create or replace function public.representation_apres_ecriture()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := coalesce(new.evenement_id, old.evenement_id);
begin
  update public.evenement
     set prochaine_date = public.calculer_prochaine_date(v_id)
   where id = v_id;
  return null;
end;
$$;

create trigger representation_apres_ecriture
  after insert or update or delete on public.representation
  for each row execute function public.representation_apres_ecriture();

-- ---------------------------------------------------------------------
-- R2 — conditions de publication
-- ---------------------------------------------------------------------
create or replace function public.peut_publier(p_evenement uuid)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.evenement e
     where e.id = p_evenement
       and coalesce(e.titre_fr, '') <> ''
       and e.categorie_id is not null
       and (e.lieu_id is not null or coalesce(e.lieu_texte, '') <> '')
       and cardinality(e.images) >= 1
       and exists (select 1 from public.representation r
                    where r.evenement_id = e.id and not r.annulee)
  );
$$;

create or replace function public.publier_evenement(p_evenement uuid)
returns public.evenement
language plpgsql security definer
set search_path = ''
as $$
declare
  v public.evenement;
begin
  if not (public.est_staff() or public.est_appel_interne()) then
    raise exception 'Accès refusé : publication réservée aux modérateurs' using errcode = '42501';
  end if;
  if not public.peut_publier(p_evenement) then
    raise exception 'Fiche incomplète : titre, catégorie, lieu, image et au moins une date sont requis'
      using errcode = '23514';
  end if;

  update public.evenement
     set statut = 'publie',
         verifie = true,
         motif_rejet = null,
         publie_le = coalesce(publie_le, now()),
         prochaine_date = public.calculer_prochaine_date(p_evenement)
   where id = p_evenement
  returning * into v;

  update public.soumission set statut = 'traitee' where evenement_id = p_evenement;

  -- Les effets externes (revalidation du site, push, réponse WhatsApp)
  -- sont déclenchés par un Database Webhook Supabase sur evenement.statut (Sprint 2).
  return v;
end;
$$;

create or replace function public.rejeter_evenement(p_evenement uuid, p_motif text)
returns public.evenement
language plpgsql security definer
set search_path = ''
as $$
declare
  v public.evenement;
begin
  if not (public.est_staff() or public.est_appel_interne()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.evenement set statut = 'rejete', motif_rejet = p_motif
   where id = p_evenement returning * into v;
  update public.soumission set statut = 'rejetee' where evenement_id = p_evenement;
  return v;
end;
$$;

-- R3 — duplication (tout sauf les dates)
create or replace function public.dupliquer_evenement(p_evenement uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.evenement (
    organisateur_id, lieu_id, lieu_texte, ville_id, categorie_id, titre_fr, titre_ar,
    description_fr, description_ar, images, prix_min, prix_max, gratuit,
    infos_reservation, lien_externe, telephone_reservation, portee, source, soumis_par, statut)
  select organisateur_id, lieu_id, lieu_texte, ville_id, categorie_id, titre_fr, titre_ar,
         description_fr, description_ar, images, prix_min, prix_max, gratuit,
         infos_reservation, lien_externe, telephone_reservation, portee, source, auth.uid(), 'brouillon'
    from public.evenement where id = p_evenement   -- RLS : seulement si visible par l'appelant
  returning id into v_id;

  if v_id is null then
    raise exception 'Événement introuvable ou non accessible' using errcode = 'P0002';
  end if;

  insert into public.evenement_artiste (evenement_id, artiste_id)
  select v_id, artiste_id from public.evenement_artiste where evenement_id = p_evenement;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- R1 — expiration (appelée par pg_cron toutes les heures)
-- ---------------------------------------------------------------------
create or replace function public.maj_dates_et_expiration()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  n integer;
begin
  update public.evenement e
     set prochaine_date = public.calculer_prochaine_date(e.id)
   where e.statut = 'publie'
     and (e.prochaine_date is null or e.prochaine_date < now());

  update public.evenement
     set statut = 'expire'
   where statut = 'publie'
     and prochaine_date is null;
  get diagnostics n = row_count;

  -- Publication planifiée
  update public.evenement e
     set statut = 'publie', publie_le = now(), verifie = true
   where e.statut = 'en_attente'
     and e.publication_prevue_le is not null
     and e.publication_prevue_le <= now()
     and public.peut_publier(e.id);

  return n;
end;
$$;

-- ---------------------------------------------------------------------
-- API publique : recherche
-- ---------------------------------------------------------------------
create or replace function public.rechercher_evenements(
  p_q           text        default null,
  p_ville       text        default null,      -- slug de ville
  p_categories  smallint[]  default null,      -- ids (parents inclus → enfants inclus)
  p_debut       timestamptz default now(),
  p_fin         timestamptz default null,
  p_gratuit     boolean     default null,
  p_limite      int         default 20,
  p_decalage    int         default 0
)
returns table (
  id uuid, slug text, titre_fr text, titre_ar text, image text,
  categorie_id smallint, ville_id smallint, lieu_nom text,
  prochaine_date timestamptz, gratuit boolean, prix_min numeric, prix_max numeric,
  featured boolean, score real, total bigint
)
language sql stable
set search_path = public, extensions
as $$
  with q as (
    select nullif(public.normaliser(p_q), '') as txt
  ),
  cats as (
    select c.id from public.categorie c
     where p_categories is not null
       and (c.id = any (p_categories) or c.parent_id = any (p_categories))
  ),
  base as (
    select e.*,
           case when (select txt from q) is null then 0::real
                else greatest(
                       ts_rank(e.recherche, websearch_to_tsquery('simple', (select txt from q))),
                       similarity(e.titre_norm, (select txt from q)))
           end as score
      from public.evenement e
     where e.statut = 'publie'
       and (p_ville is null or e.ville_id = (select v.id from public.ville v where v.slug = p_ville))
       and (p_categories is null or e.categorie_id in (select id from cats))
       and (p_gratuit is null or e.gratuit = p_gratuit)
       and exists (
             select 1 from public.representation r
              where r.evenement_id = e.id and not r.annulee
                and coalesce(r.fin, r.debut + interval '3 hours') >= coalesce(p_debut, now())
                and (p_fin is null or r.debut <= p_fin))
       and ((select txt from q) is null
            or e.recherche @@ websearch_to_tsquery('simple', (select txt from q))
            or e.titre_norm % (select txt from q))
  )
  select b.id, b.slug, b.titre_fr, b.titre_ar, b.images[1],
         b.categorie_id, b.ville_id, l.nom,
         b.prochaine_date, b.gratuit, b.prix_min, b.prix_max,
         b.featured, b.score, count(*) over ()
    from base b
    left join public.lieu l on l.id = b.lieu_id
   order by
     case when (select txt from q) is not null then b.score end desc nulls last,
     b.prochaine_date asc nulls last
   limit least(greatest(p_limite, 1), 100)
  offset greatest(p_decalage, 0);
$$;

-- ---------------------------------------------------------------------
-- API publique : événements proches (PostGIS)
-- ---------------------------------------------------------------------
create or replace function public.evenements_proches(
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
  gratuit boolean, distance_km double precision
)
language sql stable
set search_path = public, extensions
as $$
  with pt as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  )
  select e.id, e.slug, e.titre_fr, e.titre_ar, e.images[1], e.categorie_id, l.nom,
         e.prochaine_date, e.gratuit,
         round((st_distance(l.position, (select g from pt)) / 1000)::numeric, 1)::double precision
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

-- ---------------------------------------------------------------------
-- Événements similaires
-- ---------------------------------------------------------------------
create or replace function public.evenements_similaires(p_evenement uuid, p_limite int default 6)
returns setof public.evenement
language sql stable
set search_path = ''
as $$
  select e2.*
    from public.evenement e1
    join public.evenement e2 on e2.id <> e1.id and e2.statut = 'publie'
   where e1.id = p_evenement
   order by (e2.categorie_id = e1.categorie_id)::int * 2
          + (e2.ville_id = e1.ville_id)::int * 2
          + (abs(extract(epoch from (e2.prochaine_date - e1.prochaine_date))) < 7 * 86400)::int desc,
            e2.prochaine_date asc nulls last
   limit least(greatest(p_limite, 1), 20);
$$;

-- ---------------------------------------------------------------------
-- Statistiques (appelables par le public, sans accès direct à la table)
-- ---------------------------------------------------------------------
create or replace function public.compter_vue(p_evenement uuid)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.stat_evenement (evenement_id, jour, vues)
  select p_evenement, (now() at time zone 'Africa/Tunis')::date, 1
   where exists (select 1 from public.evenement where id = p_evenement and statut = 'publie')
  on conflict (evenement_id, jour) do update set vues = public.stat_evenement.vues + 1;
$$;

create or replace function public.compter_clic_reservation(p_evenement uuid)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.stat_evenement (evenement_id, jour, clics_reservation)
  select p_evenement, (now() at time zone 'Africa/Tunis')::date, 1
   where exists (select 1 from public.evenement where id = p_evenement and statut = 'publie')
  on conflict (evenement_id, jour)
  do update set clics_reservation = public.stat_evenement.clics_reservation + 1;
$$;

-- Fonctions internes : pas d'appel direct depuis l'API publique
revoke execute on function public.maj_dates_et_expiration() from public, anon, authenticated;
revoke execute on function public.creer_profil() from public, anon, authenticated;
