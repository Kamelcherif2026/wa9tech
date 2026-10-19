-- =====================================================================
-- WA9TECH — Tests rattachement automatique des lieux (import IA) et carte
-- Les lieux de test sont créés ici : en CI, les villes viennent de seed.sql,
-- appliqué après les migrations, donc les lieux de référence n'y existent pas.
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

insert into public.lieu (ville_id, nom, nom_ar, type)
select v.id, t.nom, t.nom_ar, t.type::public.type_lieu
  from (values
    ('tunis', 'Test Théâtre des Jeunes Créateurs (Cité de la Culture)', null, 'theatre'),
    ('tunis', 'Test Théâtre municipal de Tunis', 'المسرح البلدي بتونس', 'theatre'),
    ('sfax',  'Test Théâtre municipal de Sfax', 'المسرح البلدي بصفاقس', 'theatre'),
    ('sfax',  'Test Maison de la culture de Mahrès', null, 'maison_culture'),
    ('sfax',  'Test Maison de la culture de Skhira', null, 'maison_culture'),
    ('sfax',  'Test Maison de la culture d''Agareb', null, 'maison_culture')
  ) as t(ville, nom, nom_ar, type)
  join public.ville v on v.slug = t.ville;

-- Rattachement sûr malgré la ponctuation et le texte en plus
select is((select nom from public.rapprocher_lieu('Test Théâtre des Jeunes Créateurs, Cité de la Culture, Tunis',
                                                 (select id from public.ville where slug = 'tunis'))),
          'Test Théâtre des Jeunes Créateurs (Cité de la Culture)', 'salle de la Cité de la Culture reconnue');

-- La ville départage deux lieux de même nom
select is((select nom from public.rapprocher_lieu('Test Théâtre municipal', (select id from public.ville where slug = 'sfax'))),
          'Test Théâtre municipal de Sfax', 'la ville lue sur l''affiche départage');
select is((select nom from public.rapprocher_lieu('المسرح البلدي', (select id from public.ville where slug = 'sfax'))),
          'Test Théâtre municipal de Sfax', 'nom arabe reconnu');

-- Nom générique ou inconnu : pas de rattachement (le lieu reste à choisir)
select is((select count(*)::int from public.rapprocher_lieu('Test Maison de la culture', (select id from public.ville where slug = 'sfax'))),
          0, 'nom ambigu : aucun lieu imposé');
select is((select count(*)::int from public.rapprocher_lieu('Bar inconnu de Gabès')), 0, 'lieu inconnu : aucun rattachement');

-- Carte : evenements_proches existe avec ses paramètres
select has_function('public', 'evenements_proches',
                    array['double precision', 'double precision', 'integer', 'timestamp with time zone', 'timestamp with time zone', 'integer'],
                    'evenements_proches existe avec ses paramètres');

select * from finish();
rollback;
