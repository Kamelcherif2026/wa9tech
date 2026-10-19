-- =====================================================================
-- WA9TECH — Tests rattachement automatique des lieux (import IA) et carte
-- S'appuie sur les lieux de référence chargés par les migrations.
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

-- Rattachement sûr malgré la ponctuation et le texte en plus
select is((select nom from public.rapprocher_lieu('Théâtre des Jeunes Créateurs, Cité de la Culture, Tunis',
                                                 (select id from public.ville where slug = 'tunis'))),
          'Théâtre des Jeunes Créateurs (Cité de la Culture)', 'salle de la Cité de la Culture reconnue');

-- La ville départage deux lieux de même nom
select is((select nom from public.rapprocher_lieu('Théâtre municipal', (select id from public.ville where slug = 'sfax'))),
          'Théâtre municipal de Sfax', 'la ville lue sur l''affiche départage');
select is((select nom from public.rapprocher_lieu('المسرح البلدي', (select id from public.ville where slug = 'sfax'))),
          'Théâtre municipal de Sfax', 'nom arabe reconnu');

-- Nom générique ou inconnu : pas de rattachement (le lieu reste à choisir)
select is((select count(*)::int from public.rapprocher_lieu('Maison de la culture', (select id from public.ville where slug = 'sfax'))),
          0, 'nom ambigu : aucun lieu imposé');
select is((select count(*)::int from public.rapprocher_lieu('Bar inconnu de Gabès')), 0, 'lieu inconnu : aucun rattachement');

-- Carte : evenements_proches renvoie les coordonnées du lieu
select has_function('public', 'evenements_proches',
                    array['double precision', 'double precision', 'integer', 'timestamp with time zone', 'timestamp with time zone', 'integer'],
                    'evenements_proches existe avec ses paramètres');

select * from finish();
rollback;
