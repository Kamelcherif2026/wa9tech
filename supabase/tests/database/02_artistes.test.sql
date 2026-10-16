-- =====================================================================
-- WA9TECH — Tests artistes (pgTAP)
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into public.lieu (id, ville_id, nom, type, position)
select '10000000-0000-0000-0000-0000000000a1', v.id, 'Salle test', 'theatre', 'SRID=4326;POINT(10.18 36.80)'
  from public.ville v where v.slug = 'tunis';
insert into public.evenement (id, lieu_id, categorie_id, titre_fr, source)
select '20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', c.id, 'Concert test', 'admin'
  from public.categorie c where c.slug = 'concert';

-- Rapprochement : création puis reconnaissance malgré accents et casse
select isnt(public.rapprocher_artiste('Anouar Brahem'), null, 'un artiste inconnu est créé');
select is(public.rapprocher_artiste('anouar BRAHÉM'), public.rapprocher_artiste('Anouar Brahem'),
          'même artiste reconnu malgré accents et casse');
select is((select count(*)::int from public.artiste where nom = 'Anouar Brahem'), 1, 'pas de doublon créé');
select is(public.rapprocher_artiste('   '), null, 'nom vide ignoré');

-- Liste ordonnée et remplacement
select public.definir_artistes('20000000-0000-0000-0000-0000000000a1',
  array[public.rapprocher_artiste('Dhafer Youssef'), public.rapprocher_artiste('Anouar Brahem')]);
select is((select a.nom from public.evenement_artiste ea join public.artiste a on a.id = ea.artiste_id
            where ea.evenement_id = '20000000-0000-0000-0000-0000000000a1' and ea.ordre = 0),
          'Dhafer Youssef', 'la tête d''affiche est en premier');

select public.definir_artistes('20000000-0000-0000-0000-0000000000a1', array[public.rapprocher_artiste('Anouar Brahem')]);
select is((select count(*)::int from public.evenement_artiste where evenement_id = '20000000-0000-0000-0000-0000000000a1'),
          1, 'la liste est remplacée');

select is((select count(*)::int from public.rechercher_artistes('brahem')), 1, 'recherche approximative');

select * from finish();
rollback;
