-- =====================================================================
-- WA9TECH — Espace organisateurs (lot 1, étape B)
--
-- Comptes : n'importe qui crée un compte (e-mail ou Google). Pour publier,
-- l'utilisateur « devient organisateur » de deux façons :
--   1. il crée une nouvelle structure            → active tout de suite ;
--   2. il revendique une structure, un lieu ou un artiste déjà présent
--      dans WA9TECH                              → validation par l'équipe.
--
-- Événements des organisateurs :
--   - ils les créent et les soumettent (soumettre_evenement) : en attente de
--     validation, ou publiés directement si la structure a le badge
--     « organisateur de confiance » (accordé par l'équipe) ;
--   - ils peuvent modifier leurs événements publiés ; sans badge, la fiche
--     reste en ligne mais est marquée « à revérifier » pour l'équipe ;
--   - ils les retirent en les archivant (pas de suppression).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Structures (table organisateur) : type, liens, badge de confiance
-- ---------------------------------------------------------------------
alter table public.organisateur
  add column type       text not null default 'organisateur'
                        check (type in ('organisateur', 'lieu', 'artiste', 'festival')),
  add column nom_ar     text,
  add column ville_id   smallint references public.ville (id),
  add column lieu_id    uuid references public.lieu (id) on delete set null,
  add column artiste_id uuid references public.artiste (id) on delete set null,
  add column confiance  boolean not null default false;

-- Un lieu ou un artiste n'est géré que par une seule structure
create unique index organisateur_lieu_unique on public.organisateur (lieu_id) where lieu_id is not null;
create unique index organisateur_artiste_unique on public.organisateur (artiste_id) where artiste_id is not null;

alter table public.organisateur
  add constraint organisateur_nom_longueur check (char_length(btrim(nom)) between 2 and 120);

-- Champs réservés à l'équipe : un organisateur ne peut pas se donner le badge,
-- se valider lui-même ni changer les liens lieu / artiste.
create or replace function public.organisateur_garde()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.est_staff() then
    new.confiance     := old.confiance;
    new.statut_compte := old.statut_compte;
    new.slug          := old.slug;
    new.lieu_id       := old.lieu_id;
    new.artiste_id    := old.artiste_id;
  end if;
  return new;
end;
$$;

create trigger organisateur_garde before update on public.organisateur
  for each row execute function public.organisateur_garde();

-- ---------------------------------------------------------------------
-- Revendications : « cette structure / ce lieu / cet artiste, c'est moi »
-- ---------------------------------------------------------------------
create table public.revendication (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  organisateur_id uuid references public.organisateur (id) on delete cascade,
  lieu_id         uuid references public.lieu (id) on delete cascade,
  artiste_id      uuid references public.artiste (id) on delete cascade,
  message         text check (char_length(message) <= 1000),
  preuve          text check (char_length(preuve) <= 300),      -- lien vers la page officielle…
  telephone       text check (char_length(telephone) <= 30),
  statut          text not null default 'en_attente'
                  check (statut in ('en_attente', 'acceptee', 'refusee')),
  motif_refus     text,
  traitee_par     uuid references auth.users (id) on delete set null,
  traitee_le      timestamptz,
  cree_le         timestamptz not null default now(),
  constraint revendication_une_cible check (num_nonnulls(organisateur_id, lieu_id, artiste_id) = 1)
);
create unique index revendication_une_en_cours on public.revendication (user_id) where statut = 'en_attente';
create index revendication_statut_idx on public.revendication (statut, cree_le);

alter table public.revendication enable row level security;
create policy revendication_lecture on public.revendication for select to authenticated
  using (user_id = auth.uid() or public.est_staff());
-- Création et traitement uniquement par les fonctions ci-dessous

-- ---------------------------------------------------------------------
-- Événements : suivi des modifications après publication
-- ---------------------------------------------------------------------
alter table public.evenement add column a_reverifier boolean not null default false;
create index evenement_a_reverifier_idx on public.evenement (modifie_le) where a_reverifier;

-- Vrai si l'utilisateur connecté gère cette structure et qu'elle a le badge de confiance
create or replace function public.mon_organisateur_de_confiance()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select o.confiance and o.statut_compte = 'valide'
                     from public.organisateur o
                    where o.id = public.mon_organisateur()), false);
$$;

-- Droit de modifier un événement (et ses dates, ses artistes)
create or replace function public.peut_modifier_evenement(p_evenement uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.est_staff() or exists (
    select 1 from public.evenement e
     where e.id = p_evenement
       and (
         -- auteur ou structure : tant que la fiche n'est pas publiée
         (e.statut in ('brouillon', 'en_attente', 'rejete')
          and (e.soumis_par = auth.uid()
               or (e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur())))
         -- structure : aussi après publication
         or (e.statut = 'publie'
             and e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur())
       ));
$$;

-- Garde-fous côté contributeurs : structure et auteur figés, publication
-- réservée à soumettre_evenement / publier_evenement, marquage « à revérifier ».
create or replace function public.evenement_garde_contributeur()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.est_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.a_reverifier := false;   -- le statut, lui, est contrôlé par la RLS (brouillon / en attente)
    return new;
  end if;
  new.organisateur_id := old.organisateur_id;
  new.soumis_par      := old.soumis_par;
  new.source          := old.source;
  new.motif_rejet     := old.motif_rejet;
  new.a_reverifier    := old.a_reverifier
                         or (old.statut = 'publie' and not public.mon_organisateur_de_confiance());
  return new;
end;
$$;

create trigger evenement_garde_contributeur before insert or update on public.evenement
  for each row execute function public.evenement_garde_contributeur();

-- Politiques : la structure modifie aussi ses événements publiés
create policy evt_orga_maj_publie on public.evenement for update to authenticated
  using (statut = 'publie' and organisateur_id is not null and organisateur_id = public.mon_organisateur())
  with check (statut = 'publie' and organisateur_id = public.mon_organisateur());

-- Dates : mêmes droits que l'événement (y compris après publication pour la structure)
drop policy rep_ecriture on public.representation;
create policy rep_ecriture on public.representation for all to authenticated
  using (public.peut_modifier_evenement(evenement_id))
  with check (public.peut_modifier_evenement(evenement_id));

-- Artistes liés : idem (avant, réservé à l'équipe)
drop policy evtart_ecriture on public.evenement_artiste;
create policy evtart_ecriture on public.evenement_artiste for all to authenticated
  using (public.peut_modifier_evenement(evenement_id))
  with check (public.peut_modifier_evenement(evenement_id));

-- Une date ou un artiste changé par une structure sans badge sur une fiche publiée
-- la marque aussi « à revérifier ».
-- (droits de l'appelant : la mise à jour passe par la politique evt_orga_maj_publie,
-- et le marquage lui-même est décidé par evenement_garde_contributeur)
create or replace function public.marquer_a_reverifier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_evt uuid := case when tg_op = 'DELETE' then old.evenement_id else new.evenement_id end;
begin
  if current_user = 'authenticated' and not public.est_staff()
     and not public.mon_organisateur_de_confiance() then
    update public.evenement set modifie_le = now()
     where id = v_evt and statut = 'publie' and not a_reverifier;
  end if;
  return null;
end;
$$;

create trigger representation_a_reverifier after insert or update or delete on public.representation
  for each row execute function public.marquer_a_reverifier();
create trigger evenement_artiste_a_reverifier after insert or update or delete on public.evenement_artiste
  for each row execute function public.marquer_a_reverifier();

-- ---------------------------------------------------------------------
-- Fonctions appelées par le site et l'application
-- ---------------------------------------------------------------------

-- Créer sa structure : le compte devient organisateur immédiatement
create or replace function public.devenir_organisateur(
  p_nom         text,
  p_type        text default 'organisateur',
  p_ville_id    smallint default null,
  p_telephone   text default null,
  p_email       text default null,
  p_lien        text default null,
  p_description text default null,
  p_nom_ar      text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_role public.role_utilisateur;
  v_org  uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  select role, organisateur_id into v_role, v_org from public.profil where id = v_uid;
  if v_org is not null then
    raise exception 'Ce compte gère déjà une structure' using errcode = '23505';
  end if;
  if p_type not in ('organisateur', 'lieu', 'artiste', 'festival') then
    raise exception 'Type de structure inconnu' using errcode = '22023';
  end if;

  insert into public.organisateur (nom, nom_ar, type, ville_id, telephone, email, lien, description, statut_compte)
  values (btrim(p_nom), nullif(btrim(p_nom_ar), ''), p_type, p_ville_id,
          nullif(btrim(p_telephone), ''), nullif(btrim(p_email), ''), nullif(btrim(p_lien), ''),
          nullif(btrim(p_description), ''), 'valide')
  returning id into v_org;

  update public.profil
     set organisateur_id = v_org,
         role = case when role = 'public' then 'organisateur'::public.role_utilisateur else role end
   where id = v_uid;
  return v_org;
end;
$$;

-- Revendiquer une structure, un lieu ou un artiste existant (validation par l'équipe)
create or replace function public.revendiquer(
  p_organisateur uuid default null,
  p_lieu         uuid default null,
  p_artiste      uuid default null,
  p_message      text default null,
  p_preuve       text default null,
  p_telephone    text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_org uuid := p_organisateur;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if (select organisateur_id from public.profil where id = v_uid) is not null then
    raise exception 'Ce compte gère déjà une structure' using errcode = '23505';
  end if;
  if num_nonnulls(p_organisateur, p_lieu, p_artiste) <> 1 then
    raise exception 'Choisissez une seule structure, un seul lieu ou un seul artiste' using errcode = '22023';
  end if;
  -- Un lieu ou un artiste déjà géré par une structure : on revendique la structure
  if p_lieu is not null then
    select id into v_org from public.organisateur where lieu_id = p_lieu;
  elsif p_artiste is not null then
    select id into v_org from public.organisateur where artiste_id = p_artiste;
  end if;
  if exists (select 1 from public.revendication where user_id = v_uid and statut = 'en_attente') then
    raise exception 'Une demande est déjà en cours d''examen' using errcode = '23505';
  end if;

  insert into public.revendication (user_id, organisateur_id, lieu_id, artiste_id, message, preuve, telephone)
  values (v_uid, v_org,
          case when v_org is null then p_lieu end,
          case when v_org is null then p_artiste end,
          nullif(btrim(p_message), ''), nullif(btrim(p_preuve), ''), nullif(btrim(p_telephone), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- Traitement d'une revendication par l'équipe
create or replace function public.traiter_revendication(p_revendication uuid, p_accepter boolean, p_motif text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  r     public.revendication;
  v_org uuid;
begin
  if not (public.est_staff() or public.est_appel_interne()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  select * into r from public.revendication where id = p_revendication for update;
  if r.id is null or r.statut <> 'en_attente' then
    raise exception 'Demande introuvable ou déjà traitée' using errcode = '22023';
  end if;

  if not p_accepter then
    update public.revendication
       set statut = 'refusee', motif_refus = nullif(btrim(p_motif), ''), traitee_par = auth.uid(), traitee_le = now()
     where id = r.id;
    return null;
  end if;

  v_org := r.organisateur_id;
  if v_org is null and r.lieu_id is not null then
    select id into v_org from public.organisateur where lieu_id = r.lieu_id;
    if v_org is null then
      insert into public.organisateur (nom, nom_ar, type, ville_id, lieu_id, telephone, lien, statut_compte)
      select l.nom, l.nom_ar, 'lieu', l.ville_id, l.id, l.telephone, l.lien, 'valide'
        from public.lieu l where l.id = r.lieu_id
      returning id into v_org;
    end if;
    -- Les événements de ce lieu sans structure lui sont confiés
    update public.evenement set organisateur_id = v_org
     where lieu_id = r.lieu_id and organisateur_id is null;
  elsif v_org is null and r.artiste_id is not null then
    select id into v_org from public.organisateur where artiste_id = r.artiste_id;
    if v_org is null then
      insert into public.organisateur (nom, nom_ar, type, artiste_id, lien, statut_compte)
      select a.nom, a.nom_ar, 'artiste', a.id, a.lien, 'valide'
        from public.artiste a where a.id = r.artiste_id
      returning id into v_org;
    end if;
  end if;

  update public.organisateur set statut_compte = 'valide' where id = v_org;
  update public.profil
     set organisateur_id = v_org,
         role = case when role = 'public' then 'organisateur'::public.role_utilisateur else role end
   where id = r.user_id;
  update public.revendication
     set statut = 'acceptee', traitee_par = auth.uid(), traitee_le = now()
   where id = r.id;
  return v_org;
end;
$$;

-- Envoyer un événement à WA9TECH : publié directement avec le badge de confiance
-- (si la fiche est complète), sinon en attente de validation.
create or replace function public.soumettre_evenement(p_evenement uuid)
returns public.statut_evenement
language plpgsql security definer
set search_path = ''
as $$
declare
  e public.evenement;
begin
  select * into e from public.evenement where id = p_evenement;
  if e.id is null or not (
       e.soumis_par = auth.uid()
       or (e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur())) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if e.statut not in ('brouillon', 'en_attente', 'rejete') then
    return e.statut;
  end if;

  if e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur()
     and public.mon_organisateur_de_confiance() and public.peut_publier(p_evenement) then
    update public.evenement
       set statut = 'publie', verifie = true, motif_rejet = null, a_reverifier = false,
           publie_le = coalesce(publie_le, now()),
           prochaine_date = public.calculer_prochaine_date(p_evenement)
     where id = p_evenement;
    return 'publie';
  end if;

  update public.evenement set statut = 'en_attente', motif_rejet = null where id = p_evenement;
  return 'en_attente';
end;
$$;

-- Retirer un de ses événements (archivage, la fiche disparaît du site)
create or replace function public.archiver_evenement(p_evenement uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not (public.est_staff() or exists (
       select 1 from public.evenement e
        where e.id = p_evenement
          and (e.soumis_par = auth.uid()
               or (e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur())))) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.evenement set statut = 'archive' where id = p_evenement;
end;
$$;

-- L'équipe a revu une fiche modifiée après publication
create or replace function public.marquer_reverifie(p_evenement uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.est_staff() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.evenement set a_reverifier = false where id = p_evenement;
end;
$$;

-- Recherche de structures, lieux et artistes à revendiquer (« c'est moi »)
create or replace function public.chercher_a_revendiquer(p_q text, p_limite int default 12)
returns table (genre text, id uuid, nom text, nom_ar text, ville text, deja_gere boolean)
language sql stable security definer
set search_path = public, extensions
as $$
  with q as (select public.normaliser(p_q) as n)
  select t.genre, t.id, t.nom, t.nom_ar, t.ville, t.deja_gere from (
    select 'organisateur'::text as genre, o.id, o.nom, o.nom_ar, v.nom_fr as ville,
           exists (select 1 from public.profil p where p.organisateur_id = o.id) as deja_gere,
           similarity(public.normaliser(o.nom), q.n) as s
      from public.organisateur o left join public.ville v on v.id = o.ville_id, q
     where char_length(q.n) >= 2 and public.normaliser(o.nom) like '%' || q.n || '%'
    union all
    select 'lieu', l.id, l.nom, l.nom_ar, v.nom_fr,
           exists (select 1 from public.organisateur o where o.lieu_id = l.id and o.statut_compte = 'valide'),
           similarity(public.normaliser(l.nom), q.n)
      from public.lieu l join public.ville v on v.id = l.ville_id, q
     where l.actif and char_length(q.n) >= 2
       and (public.normaliser(l.nom) like '%' || q.n || '%' or public.normaliser(l.nom_ar) like '%' || q.n || '%')
    union all
    select 'artiste', a.id, a.nom, a.nom_ar, null,
           exists (select 1 from public.organisateur o where o.artiste_id = a.id and o.statut_compte = 'valide'),
           similarity(public.normaliser(a.nom), q.n)
      from public.artiste a, q
     where char_length(q.n) >= 2
       and (public.normaliser(a.nom) like '%' || q.n || '%' or public.normaliser(a.nom_ar) like '%' || q.n || '%')
  ) t
  order by t.s desc, t.nom
  limit least(greatest(coalesce(p_limite, 12), 1), 30);
$$;

-- Les organisateurs peuvent aussi retrouver / créer des artistes en saisissant leur nom
-- (avant : équipe et import IA seulement).
create or replace function public.rapprocher_artiste(p_nom text)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_nom text := btrim(regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g'));
  v_n   text;
  v_id  uuid;
begin
  if not (public.est_staff() or public.est_appel_interne()
          or public.role_courant() in ('organisateur', 'ambassadeur')) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if v_nom = '' or length(v_nom) > 120 then
    return null;
  end if;
  v_n := public.normaliser(v_nom);

  select a.id into v_id
    from public.artiste a
   where public.normaliser(a.nom) = v_n
      or public.normaliser(a.nom_ar) = v_n
      or similarity(public.normaliser(a.nom), v_n) >= 0.8
   order by (public.normaliser(a.nom) = v_n or public.normaliser(a.nom_ar) = v_n) desc,
            similarity(public.normaliser(a.nom), v_n) desc
   limit 1;

  if v_id is null then
    insert into public.artiste (nom, nom_ar)
    values (v_nom, case when v_nom ~ '[ء-ي]' then v_nom end)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Statistiques de mes événements (vues, clics sur la réservation) sur une période
create or replace function public.statistiques_organisateur(p_depuis date default (current_date - 30))
returns table (evenement_id uuid, titre_fr text, slug text, statut public.statut_evenement,
               vues bigint, clics_reservation bigint)
language sql stable security definer
set search_path = ''
as $$
  select e.id, e.titre_fr, e.slug, e.statut,
         coalesce(sum(s.vues), 0), coalesce(sum(s.clics_reservation), 0)
    from public.evenement e
    left join public.stat_evenement s on s.evenement_id = e.id and s.jour >= p_depuis
   where e.organisateur_id is not null
     and e.organisateur_id = public.mon_organisateur()
     and e.statut <> 'archive'
   group by e.id
   order by coalesce(sum(s.vues), 0) desc, e.titre_fr;
$$;

-- Droits d'exécution : fonctions réservées aux comptes connectés
revoke execute on function public.devenir_organisateur(text, text, smallint, text, text, text, text, text) from public, anon;
revoke execute on function public.revendiquer(uuid, uuid, uuid, text, text, text) from public, anon;
revoke execute on function public.traiter_revendication(uuid, boolean, text) from public, anon;
revoke execute on function public.soumettre_evenement(uuid) from public, anon;
revoke execute on function public.archiver_evenement(uuid) from public, anon;
revoke execute on function public.marquer_reverifie(uuid) from public, anon;
revoke execute on function public.statistiques_organisateur(date) from public, anon;
revoke execute on function public.rapprocher_artiste(text) from public, anon;
grant execute on function public.devenir_organisateur(text, text, smallint, text, text, text, text, text) to authenticated;
grant execute on function public.revendiquer(uuid, uuid, uuid, text, text, text) to authenticated;
grant execute on function public.traiter_revendication(uuid, boolean, text) to authenticated, service_role;
grant execute on function public.soumettre_evenement(uuid) to authenticated;
grant execute on function public.archiver_evenement(uuid) to authenticated;
grant execute on function public.marquer_reverifie(uuid) to authenticated;
grant execute on function public.statistiques_organisateur(date) to authenticated;
grant execute on function public.rapprocher_artiste(text) to authenticated, service_role;
