-- =====================================================================
-- WA9TECH — Migration 3 : sécurité par ligne (Row Level Security)
-- Règle : RLS activée sur TOUTES les tables. Les Edge Functions utilisent
-- la clé service_role (qui contourne la RLS) uniquement côté serveur.
-- =====================================================================

alter table public.ville              enable row level security;
alter table public.categorie          enable row level security;
alter table public.lieu               enable row level security;
alter table public.organisateur       enable row level security;
alter table public.artiste            enable row level security;
alter table public.profil             enable row level security;
alter table public.evenement          enable row level security;
alter table public.representation     enable row level security;
alter table public.evenement_artiste  enable row level security;
alter table public.film               enable row level security;
alter table public.seance             enable row level security;
alter table public.soumission         enable row level security;
alter table public.favori             enable row level security;
alter table public.rappel             enable row level security;
alter table public.appareil           enable row level security;
alter table public.newsletter_abonne  enable row level security;
alter table public.stat_evenement     enable row level security;

-- ---------------------------------------------------------------------
-- Référentiels : lecture publique, écriture staff
-- ---------------------------------------------------------------------
create policy lecture_publique on public.ville        for select to anon, authenticated using (true);
create policy lecture_publique on public.categorie    for select to anon, authenticated using (true);
create policy lecture_publique on public.organisateur for select to anon, authenticated using (true);
create policy lecture_publique on public.artiste      for select to anon, authenticated using (true);
create policy lecture_publique on public.film         for select to anon, authenticated using (true);
create policy lecture_publique on public.seance       for select to anon, authenticated using (true);
create policy lecture_publique on public.lieu         for select to anon, authenticated
  using (actif or public.est_staff());

create policy ecriture_staff on public.ville        for all to authenticated using (public.est_staff()) with check (public.est_staff());
create policy ecriture_staff on public.categorie    for all to authenticated using (public.est_staff()) with check (public.est_staff());
create policy ecriture_staff on public.lieu         for all to authenticated using (public.est_staff()) with check (public.est_staff());
create policy ecriture_staff on public.organisateur for all to authenticated using (public.est_staff()) with check (public.est_staff());
create policy ecriture_staff on public.artiste      for all to authenticated using (public.est_staff()) with check (public.est_staff());
create policy ecriture_staff on public.film         for all to authenticated using (public.est_staff()) with check (public.est_staff());
create policy ecriture_staff on public.seance       for all to authenticated using (public.est_staff()) with check (public.est_staff());

-- Un organisateur peut mettre à jour sa propre fiche organisateur
create policy orga_maj_sa_fiche on public.organisateur for update to authenticated
  using (id = public.mon_organisateur()) with check (id = public.mon_organisateur());

-- ---------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------
create policy profil_lecture on public.profil for select to authenticated
  using (id = auth.uid() or public.est_staff());
create policy profil_maj_soi on public.profil for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profil_staff on public.profil for update to authenticated
  using (public.role_courant() = 'admin') with check (public.role_courant() = 'admin');

-- Un utilisateur ne peut modifier que ces colonnes de son profil (pas son rôle)
revoke update on public.profil from anon, authenticated;
grant update (nom, ville_defaut, langue) on public.profil to authenticated;
-- L'admin change les rôles via la fonction ci-dessous
create or replace function public.definir_role(p_user uuid, p_role public.role_utilisateur, p_organisateur uuid default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if public.role_courant() <> 'admin' and not public.est_appel_interne() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.profil set role = p_role, organisateur_id = p_organisateur where id = p_user;
end;
$$;

-- ---------------------------------------------------------------------
-- Événements
-- ---------------------------------------------------------------------
create policy evt_lecture on public.evenement for select to anon, authenticated
  using (
    statut = 'publie'
    or public.est_staff()
    or soumis_par = auth.uid()
    or (organisateur_id is not null and organisateur_id = public.mon_organisateur())
  );

create policy evt_staff on public.evenement for all to authenticated
  using (public.est_staff()) with check (public.est_staff());

-- Contributeurs (organisateur, ambassadeur) : création en brouillon / en attente
create policy evt_contrib_creation on public.evenement for insert to authenticated
  with check (
    public.role_courant() in ('organisateur', 'ambassadeur')
    and soumis_par = auth.uid()
    and statut in ('brouillon', 'en_attente')
    and (public.role_courant() <> 'organisateur' or organisateur_id = public.mon_organisateur())
  );

-- Contributeurs : modification tant que non publié
create policy evt_contrib_maj on public.evenement for update to authenticated
  using (
    statut in ('brouillon', 'en_attente', 'rejete')
    and (soumis_par = auth.uid()
         or (organisateur_id is not null and organisateur_id = public.mon_organisateur()))
  )
  with check (
    statut in ('brouillon', 'en_attente')
    and (soumis_par = auth.uid()
         or (organisateur_id is not null and organisateur_id = public.mon_organisateur()))
  );
-- Pas de policy DELETE : suppression = passage en 'archive' (R4)

-- ---------------------------------------------------------------------
-- Représentations et artistes liés : suivent les droits de l'événement
-- ---------------------------------------------------------------------
create policy rep_lecture on public.representation for select to anon, authenticated
  using (exists (select 1 from public.evenement e where e.id = evenement_id));   -- RLS de evenement appliquée

create policy rep_ecriture on public.representation for all to authenticated
  using (
    public.est_staff() or exists (
      select 1 from public.evenement e
       where e.id = evenement_id
         and e.statut in ('brouillon', 'en_attente', 'rejete')
         and (e.soumis_par = auth.uid()
              or (e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur())))
  )
  with check (
    public.est_staff() or exists (
      select 1 from public.evenement e
       where e.id = evenement_id
         and e.statut in ('brouillon', 'en_attente', 'rejete')
         and (e.soumis_par = auth.uid()
              or (e.organisateur_id is not null and e.organisateur_id = public.mon_organisateur())))
  );

create policy evtart_lecture on public.evenement_artiste for select to anon, authenticated
  using (exists (select 1 from public.evenement e where e.id = evenement_id));
create policy evtart_ecriture on public.evenement_artiste for all to authenticated
  using (public.est_staff()) with check (public.est_staff());

-- ---------------------------------------------------------------------
-- Soumissions : staff + l'auteur connecté
-- (WhatsApp / e-mail / formulaire anonyme passent par la clé service_role)
-- ---------------------------------------------------------------------
create policy soum_staff on public.soumission for all to authenticated
  using (public.est_staff()) with check (public.est_staff());
create policy soum_auteur_lecture on public.soumission for select to authenticated
  using (soumis_par = auth.uid());
create policy soum_auteur_creation on public.soumission for insert to authenticated
  with check (soumis_par = auth.uid() and statut = 'recue');

-- ---------------------------------------------------------------------
-- Données personnelles de l'utilisateur
-- ---------------------------------------------------------------------
create policy favori_soi on public.favori for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rappel_soi on public.rappel for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy appareil_soi on public.appareil for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Newsletter et statistiques : pas d'accès direct du public
create policy newsletter_staff on public.newsletter_abonne for select to authenticated
  using (public.est_staff());
create policy stat_staff on public.stat_evenement for select to authenticated
  using (public.est_staff());
create policy stat_orga on public.stat_evenement for select to authenticated
  using (exists (select 1 from public.evenement e
                  where e.id = evenement_id
                    and e.organisateur_id is not null
                    and e.organisateur_id = public.mon_organisateur()));
