-- =====================================================================
-- WA9TECH — Migration 1 : schéma initial
-- =====================================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
create type public.statut_evenement as enum
  ('brouillon', 'en_attente', 'publie', 'rejete', 'expire', 'archive');

create type public.portee_evenement as enum ('locale', 'nationale', 'internationale');

create type public.source_soumission as enum
  ('whatsapp', 'email', 'formulaire', 'ambassadeur', 'organisateur', 'admin');

create type public.role_utilisateur as enum
  ('public', 'organisateur', 'ambassadeur', 'moderateur', 'admin');

create type public.type_lieu as enum
  ('theatre', 'cinema', 'salle_concert', 'maison_culture', 'centre_culturel',
   'galerie', 'musee', 'cafe_culturel', 'bar_restaurant', 'espace_alternatif',
   'plein_air', 'site_patrimonial', 'hotel', 'autre');

create type public.statut_soumission as enum
  ('recue', 'extraite', 'traitee', 'rejetee', 'erreur');

-- ---------------------------------------------------------------------
-- Référentiels
-- ---------------------------------------------------------------------
create table public.ville (
  id          smallserial primary key,
  slug        text unique not null,
  nom_fr      text not null,
  nom_ar      text not null,
  gouvernorat text not null,
  position    extensions.geography(point, 4326) not null
);

create table public.categorie (
  id         smallserial primary key,
  slug       text unique not null,
  parent_id  smallint references public.categorie (id),
  libelle_fr text not null,
  libelle_ar text not null,
  icone      text,
  ordre      smallint not null default 0
);
create index categorie_parent_idx on public.categorie (parent_id);

create table public.lieu (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  ville_id   smallint not null references public.ville (id),
  nom        text not null,
  nom_ar     text,
  type       public.type_lieu not null,
  adresse    text,
  telephone  text,
  lien       text,
  position   extensions.geography(point, 4326),
  nom_norm   text,                                   -- maintenu par trigger
  actif      boolean not null default true,
  cree_le    timestamptz not null default now()
);
create index lieu_position_idx on public.lieu using gist (position);
create index lieu_ville_idx on public.lieu (ville_id);
create index lieu_nom_trgm_idx on public.lieu using gin (nom_norm extensions.gin_trgm_ops);

create table public.organisateur (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  nom           text not null,
  logo_url      text,
  description   text,
  telephone     text,
  email         text,
  lien          text,
  statut_compte text not null default 'non_reclame'
                check (statut_compte in ('non_reclame', 'en_attente', 'valide')),
  cree_le       timestamptz not null default now()
);

create table public.artiste (
  id     uuid primary key default gen_random_uuid(),
  slug   text unique not null,
  nom    text not null,
  nom_ar text,
  lien   text
);

-- ---------------------------------------------------------------------
-- Profils (1-1 avec auth.users)
-- ---------------------------------------------------------------------
create table public.profil (
  id              uuid primary key references auth.users (id) on delete cascade,
  nom             text,
  role            public.role_utilisateur not null default 'public',
  organisateur_id uuid references public.organisateur (id),
  ville_defaut    smallint references public.ville (id),
  langue          text not null default 'fr' check (langue in ('fr', 'ar')),
  cree_le         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Événements
-- ---------------------------------------------------------------------
create table public.evenement (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  organisateur_id       uuid references public.organisateur (id),
  lieu_id               uuid references public.lieu (id),
  lieu_texte            text,
  ville_id              smallint references public.ville (id),
  categorie_id          smallint not null references public.categorie (id),
  titre_fr              text not null,
  titre_ar              text,
  description_fr        text,
  description_ar        text,
  images                text[] not null default '{}',
  prix_min              numeric(8, 3),
  prix_max              numeric(8, 3),
  gratuit               boolean not null default false,
  infos_reservation     text,
  lien_externe          text,
  telephone_reservation text,
  portee                public.portee_evenement not null default 'locale',
  source                public.source_soumission not null default 'admin',
  soumis_par            uuid references auth.users (id),
  verifie               boolean not null default false,
  featured              boolean not null default false,
  statut                public.statut_evenement not null default 'brouillon',
  motif_rejet           text,
  prochaine_date        timestamptz,                 -- maintenu par trigger
  titre_norm            text,                        -- maintenu par trigger
  recherche             tsvector,                    -- maintenu par trigger
  publication_prevue_le timestamptz,
  cree_le               timestamptz not null default now(),
  publie_le             timestamptz,
  modifie_le            timestamptz not null default now(),
  constraint prix_coherent check (prix_max is null or prix_min is null or prix_max >= prix_min)
);
create index evenement_statut_date_idx on public.evenement (statut, prochaine_date);
create index evenement_ville_cat_idx on public.evenement (ville_id, categorie_id, prochaine_date);
create index evenement_lieu_idx on public.evenement (lieu_id);
create index evenement_orga_idx on public.evenement (organisateur_id);
create index evenement_recherche_idx on public.evenement using gin (recherche);
create index evenement_titre_trgm_idx on public.evenement using gin (titre_norm extensions.gin_trgm_ops);

create table public.representation (
  id           uuid primary key default gen_random_uuid(),
  evenement_id uuid not null references public.evenement (id) on delete cascade,
  debut        timestamptz not null,
  fin          timestamptz,
  annulee      boolean not null default false,
  constraint fin_apres_debut check (fin is null or fin > debut)
);
create index representation_evt_idx on public.representation (evenement_id, debut);
create index representation_debut_idx on public.representation (debut);

create table public.evenement_artiste (
  evenement_id uuid references public.evenement (id) on delete cascade,
  artiste_id   uuid references public.artiste (id) on delete cascade,
  primary key (evenement_id, artiste_id)
);

-- ---------------------------------------------------------------------
-- Cinéma
-- ---------------------------------------------------------------------
create table public.film (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  titre       text not null,
  titre_ar    text,
  affiche_url text,
  duree_min   smallint,
  realisateur text,
  pays        text,
  annee       smallint,
  synopsis    text
);

create table public.seance (
  id      uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.film (id) on delete cascade,
  lieu_id uuid not null references public.lieu (id),
  debut   timestamptz not null,
  version text,   -- VF, VO, VOSTFR, VOSTAR
  format  text,   -- 2D, 3D
  salle   text
);
create index seance_lieu_debut_idx on public.seance (lieu_id, debut);
create index seance_film_idx on public.seance (film_id, debut);

-- ---------------------------------------------------------------------
-- Soumissions (WhatsApp, e-mail, formulaire, ambassadeurs…)
-- ---------------------------------------------------------------------
create table public.soumission (
  id            uuid primary key default gen_random_uuid(),
  canal         public.source_soumission not null,
  expediteur    text,                       -- n° WhatsApp ou e-mail (donnée personnelle)
  soumis_par    uuid references auth.users (id),
  texte_brut    text,
  images        text[] not null default '{}',
  extraction_ia jsonb,
  confiance_ia  real,
  doublon_de    uuid references public.evenement (id),
  evenement_id  uuid references public.evenement (id),
  statut        public.statut_soumission not null default 'recue',
  erreur        text,
  recue_le      timestamptz not null default now()
);
create index soumission_statut_idx on public.soumission (statut, recue_le);

-- ---------------------------------------------------------------------
-- Utilisateurs : favoris, rappels, appareils, newsletter
-- ---------------------------------------------------------------------
create table public.favori (
  user_id      uuid references auth.users (id) on delete cascade,
  evenement_id uuid references public.evenement (id) on delete cascade,
  cree_le      timestamptz not null default now(),
  primary key (user_id, evenement_id)
);

create table public.rappel (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  evenement_id uuid not null references public.evenement (id) on delete cascade,
  canal        text not null check (canal in ('push', 'email')),
  envoyer_le   timestamptz not null,
  envoye       boolean not null default false
);
create index rappel_a_envoyer_idx on public.rappel (envoyer_le) where not envoye;

create table public.appareil (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete cascade,  -- null = anonyme
  token_fcm       text unique not null,
  plateforme      text check (plateforme in ('android', 'ios', 'web')),
  langue          text not null default 'fr',
  villes          smallint[] not null default '{}',
  categories      smallint[] not null default '{}',
  position_approx extensions.geography(point, 4326),   -- arrondie, seulement si consentement
  rayon_km        smallint not null default 25,
  maj_le          timestamptz not null default now()
);
create index appareil_position_idx on public.appareil using gist (position_approx);

create table public.newsletter_abonne (
  email           text primary key,
  ville_id        smallint references public.ville (id),
  langue          text not null default 'fr',
  consentement_le timestamptz not null default now(),
  desinscrit_le   timestamptz
);

-- ---------------------------------------------------------------------
-- Statistiques
-- ---------------------------------------------------------------------
create table public.stat_evenement (
  evenement_id      uuid references public.evenement (id) on delete cascade,
  jour              date not null,
  vues              int not null default 0,
  clics_reservation int not null default 0,
  primary key (evenement_id, jour)
);
