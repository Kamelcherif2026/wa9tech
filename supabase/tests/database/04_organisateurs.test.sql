-- =====================================================================
-- WA9TECH — Tests espace organisateurs (pgTAP)
-- A : crée sa structure · B : revendique un lieu · M : modérateur · C : public
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.tn'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.tn'),
  ('00000000-0000-0000-0000-0000000000c1', 'c@test.tn'),
  ('00000000-0000-0000-0000-0000000000d1', 'm@test.tn');
select public.definir_role('00000000-0000-0000-0000-0000000000d1', 'moderateur');

-- Un lieu de test et un événement publié qui s'y déroule, sans structure
insert into public.lieu (id, ville_id, nom, type, position)
select '10000000-0000-0000-0000-0000000000f1', v.id, 'Salle Test Organisateurs', 'salle_concert', 'SRID=4326;POINT(10.18 36.80)'
  from public.ville v where v.slug = 'tunis';
insert into public.evenement (id, lieu_id, categorie_id, titre_fr, images, source, statut)
select '20000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-0000000000f1', c.id,
       'Concert du lieu', array['https://exemple.tn/a.jpg'], 'admin', 'publie'
  from public.categorie c where c.slug = 'concert';

-- ---------------------------------------------------------------------
-- A crée sa structure
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select isnt(public.devenir_organisateur('Studio Test', 'organisateur', (select id from public.ville where slug = 'tunis')),
            null, 'A crée sa structure');
select is(public.role_courant(), 'organisateur'::public.role_utilisateur, 'A devient organisateur');
select throws_ok($$ select public.devenir_organisateur('Deuxième structure') $$, '23505', null,
                 'une seule structure par compte');

update public.organisateur set nom = 'Studio Test 2', confiance = true, statut_compte = 'en_attente'
 where id = public.mon_organisateur();
select is((select nom from public.organisateur where id = public.mon_organisateur()), 'Studio Test 2',
          'A modifie le nom de sa structure');
select is((select confiance from public.organisateur where id = public.mon_organisateur()), false,
          'A ne peut pas se donner le badge de confiance');
select is((select statut_compte from public.organisateur where id = public.mon_organisateur()), 'valide',
          'A ne peut pas changer le statut de sa structure');

-- Événement de A : sans badge → en attente
insert into public.evenement (id, organisateur_id, soumis_par, lieu_id, categorie_id, titre_fr, images, source, statut)
select '20000000-0000-0000-0000-0000000000a1', public.mon_organisateur(), auth.uid(),
       '10000000-0000-0000-0000-0000000000f1', c.id, 'Événement A1', array['https://exemple.tn/1.jpg'], 'organisateur', 'brouillon'
  from public.categorie c where c.slug = 'concert';
insert into public.representation (evenement_id, debut) values ('20000000-0000-0000-0000-0000000000a1', now() + interval '10 days');
select is(public.soumettre_evenement('20000000-0000-0000-0000-0000000000a1'), 'en_attente'::public.statut_evenement,
          'sans badge : la fiche attend la validation');

-- A ne peut pas modifier l'événement du lieu (il n'en est pas responsable)
update public.evenement set titre_fr = 'Piraté' where id = '20000000-0000-0000-0000-0000000000f1';
reset role;
select is((select titre_fr from public.evenement where id = '20000000-0000-0000-0000-0000000000f1'), 'Concert du lieu',
          'A ne peut pas modifier l''événement d''un autre');

-- ---------------------------------------------------------------------
-- Le modérateur donne le badge à A → publication directe
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
update public.organisateur set confiance = true
 where id = (select organisateur_id from public.profil where id = '00000000-0000-0000-0000-0000000000a1');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
insert into public.evenement (id, organisateur_id, soumis_par, lieu_id, categorie_id, titre_fr, images, source, statut)
select '20000000-0000-0000-0000-0000000000a2', public.mon_organisateur(), auth.uid(),
       '10000000-0000-0000-0000-0000000000f1', c.id, 'Événement A2', array['https://exemple.tn/2.jpg'], 'organisateur', 'brouillon'
  from public.categorie c where c.slug = 'concert';
insert into public.representation (evenement_id, debut) values ('20000000-0000-0000-0000-0000000000a2', now() + interval '12 days');
select is(public.soumettre_evenement('20000000-0000-0000-0000-0000000000a2'), 'publie'::public.statut_evenement,
          'avec badge : publication directe');

update public.evenement set titre_fr = 'Événement A2 (corrigé)' where id = '20000000-0000-0000-0000-0000000000a2';
select is((select a_reverifier from public.evenement where id = '20000000-0000-0000-0000-0000000000a2'), false,
          'avec badge : modification après publication sans revérification');

-- Le badge est retiré : une modification de fiche publiée la marque « à revérifier »
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
update public.organisateur set confiance = false
 where id = (select organisateur_id from public.profil where id = '00000000-0000-0000-0000-0000000000a1');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
update public.evenement set titre_fr = 'Événement A2 (re-corrigé)', statut = 'publie' where id = '20000000-0000-0000-0000-0000000000a2';
select is((select statut from public.evenement where id = '20000000-0000-0000-0000-0000000000a2'), 'publie'::public.statut_evenement,
          'sans badge : la fiche modifiée reste en ligne');
select is((select a_reverifier from public.evenement where id = '20000000-0000-0000-0000-0000000000a2'), true,
          'sans badge : la fiche modifiée est à revérifier');

-- Une date ajoutée sur la fiche publiée est acceptée
insert into public.representation (evenement_id, debut) values ('20000000-0000-0000-0000-0000000000a2', now() + interval '20 days');
select is((select count(*)::int from public.representation where evenement_id = '20000000-0000-0000-0000-0000000000a2'), 2,
          'la structure ajoute une date à sa fiche publiée');

select is((select count(*)::int from public.statistiques_organisateur()), 2, 'statistiques : mes 2 événements');

select lives_ok($$ select public.archiver_evenement('20000000-0000-0000-0000-0000000000a1') $$, 'A archive son événement');

-- ---------------------------------------------------------------------
-- B revendique le lieu, le modérateur accepte
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select is((select count(*)::int from public.chercher_a_revendiquer('salle test organisateurs') where genre = 'lieu'), 1,
          'recherche du lieu à revendiquer');
select isnt(public.revendiquer(p_lieu => '10000000-0000-0000-0000-0000000000f1', p_message => 'Je dirige cette salle'),
            null, 'B revendique le lieu');
select throws_ok($$ select public.revendiquer(p_lieu => '10000000-0000-0000-0000-0000000000f1') $$, '23505', null,
                 'une seule demande en cours');
select throws_ok($$ select public.traiter_revendication((select id from public.revendication limit 1), true) $$, '42501', null,
                 'B ne peut pas valider sa propre demande');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
select isnt(public.traiter_revendication(
              (select id from public.revendication where user_id = '00000000-0000-0000-0000-0000000000b1'), true),
            null, 'le modérateur accepte la demande');
reset role;

select is((select o.lieu_id from public.profil p join public.organisateur o on o.id = p.organisateur_id
            where p.id = '00000000-0000-0000-0000-0000000000b1'),
          '10000000-0000-0000-0000-0000000000f1'::uuid, 'B gère maintenant le lieu');
select is((select e.organisateur_id from public.evenement e where e.id = '20000000-0000-0000-0000-0000000000f1'),
          (select organisateur_id from public.profil where id = '00000000-0000-0000-0000-0000000000b1'),
          'les événements du lieu sont confiés à B');

select * from finish();
rollback;
