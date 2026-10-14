-- =====================================================================
-- WA9TECH — Tests base de données (pgTAP) : `supabase test db`
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

-- ---------------------------------------------------------------------
-- Données de test
-- ---------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.tn',  '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'amb@test.tn',    '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'public@test.tn', '{}');

select public.definir_role('00000000-0000-0000-0000-00000000000a', 'admin');
select public.definir_role('00000000-0000-0000-0000-00000000000b', 'ambassadeur');

insert into public.lieu (id, ville_id, nom, type, position)
select '10000000-0000-0000-0000-000000000001', v.id, 'Théâtre municipal de Sfax', 'theatre',
       'SRID=4326;POINT(10.7600 34.7400)'
  from public.ville v where v.slug = 'sfax';

insert into public.evenement (id, lieu_id, categorie_id, titre_fr, titre_ar, source)
select '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
       c.id, 'Soirée Mezoued', 'سهرة مزود', 'admin'
  from public.categorie c where c.slug = 'musique-traditionnelle';

insert into public.representation (evenement_id, debut)
values ('20000000-0000-0000-0000-000000000001', now() + interval '3 days');

-- ---------------------------------------------------------------------
-- Référentiels et utilitaires
-- ---------------------------------------------------------------------
select is((select count(*)::int from public.ville), 32, '32 villes chargées');
select is((select count(*)::int from public.categorie), 41, '41 catégories chargées (10 + 31)');
select is(public.normaliser('إلى المَدرسة'), 'الي المدرسه', 'normalisation de l''arabe');
select is(public.normaliser('Théâtre'), 'theatre', 'normalisation du français');
select is((select count(*)::int from public.profil), 3, 'profil créé automatiquement à l''inscription');
select ok((select slug from public.evenement where id = '20000000-0000-0000-0000-000000000001')
          like 'soiree-mezoued-%', 'slug généré automatiquement');
select is((select v.slug from public.evenement e join public.ville v on v.id = e.ville_id
            where e.id = '20000000-0000-0000-0000-000000000001'), 'sfax', 'ville déduite du lieu');
select isnt((select prochaine_date from public.evenement
              where id = '20000000-0000-0000-0000-000000000001'), null, 'prochaine_date calculée');

-- ---------------------------------------------------------------------
-- Publication (R2)
-- ---------------------------------------------------------------------
select ok(not public.peut_publier('20000000-0000-0000-0000-000000000001'), 'sans image : non publiable');

update public.evenement set images = '{affiches/test.webp}'
 where id = '20000000-0000-0000-0000-000000000001';

-- Un utilisateur public ne peut pas publier
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select throws_ok($$ select public.publier_evenement('20000000-0000-0000-0000-000000000001') $$,
                 '42501', null, 'un utilisateur public ne peut pas publier');

-- L'admin peut publier
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok($$ select public.publier_evenement('20000000-0000-0000-0000-000000000001') $$,
                'l''admin publie');
reset role;
select is((select statut::text from public.evenement where id = '20000000-0000-0000-0000-000000000001'),
          'publie', 'statut publie');

-- ---------------------------------------------------------------------
-- Visibilité (RLS)
-- ---------------------------------------------------------------------
insert into public.evenement (id, lieu_id, categorie_id, titre_fr, source)
select '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
       c.id, 'Brouillon secret', 'admin'
  from public.categorie c where c.slug = 'concert';

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is((select count(*)::int from public.evenement), 1, 'anonyme : voit seulement les publiés');
select is((select count(*)::int from public.representation), 1, 'anonyme : représentations des publiés');
reset role;

-- Utilisateur public : ne peut pas créer d'événement
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select throws_ok($$ insert into public.evenement (categorie_id, titre_fr, soumis_par, statut)
                    values (1, 'Spam', '00000000-0000-0000-0000-00000000000c', 'en_attente') $$,
                 '42501', null, 'utilisateur public : création refusée');
select throws_ok($$ update public.profil set role = 'admin'
                     where id = '00000000-0000-0000-0000-00000000000c' $$,
                 '42501', null, 'utilisateur : ne peut pas changer son rôle');

-- Ambassadeur : création en attente OK, publication directe refusée, champs staff ignorés
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select lives_ok($$ insert into public.evenement (id, categorie_id, titre_fr, lieu_texte, soumis_par, statut, source, verifie, featured)
                   values ('20000000-0000-0000-0000-000000000003', 1, 'Live au café', 'Café X, Gabès',
                           '00000000-0000-0000-0000-00000000000b', 'en_attente', 'ambassadeur', true, true) $$,
                'ambassadeur : création en attente');
select throws_ok($$ insert into public.evenement (categorie_id, titre_fr, soumis_par, statut, source)
                    values (1, 'Triche', '00000000-0000-0000-0000-00000000000b', 'publie', 'ambassadeur') $$,
                 '42501', null, 'ambassadeur : publication directe refusée');
select is((select verifie or featured from public.evenement where id = '20000000-0000-0000-0000-000000000003'),
          false, 'ambassadeur : verifie/featured forcés à false');

-- Favoris : uniquement les siens
select lives_ok($$ insert into public.favori (user_id, evenement_id)
                   values ('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001') $$,
                'favori : ajout pour soi');
select throws_ok($$ insert into public.favori (user_id, evenement_id)
                    values ('00000000-0000-0000-0000-00000000000c', '20000000-0000-0000-0000-000000000001') $$,
                 '42501', null, 'favori : refusé pour autrui');
reset role;

-- ---------------------------------------------------------------------
-- Recherche et proximité
-- ---------------------------------------------------------------------
select is((select count(*)::int from public.rechercher_evenements(p_q => 'مزود')), 1,
          'recherche en arabe');
select is((select count(*)::int from public.rechercher_evenements(p_q => 'صفاقس')), 1,
          'recherche par nom de ville en arabe');
select is((select count(*)::int from public.evenements_proches(34.7406, 10.7603, 5)), 1,
          'événement trouvé dans un rayon de 5 km');

select * from finish();
rollback;
