-- =====================================================================
-- WA9TECH — Référentiels, 2e passe (19/10/2026)
-- + 47 lieux (clubs et bars avec DJ/live, galeries, cinémas, lieux de la médina utilisés par
--   les festivals) et coordonnées GPS pour 54 lieux qui n'en avaient pas.
-- Sources : pages listées dans docs/donnees/*_complement*.json (OpenStreetMap via mapcarta surtout).
-- Idempotent : pas de doublon de lieu ; une position déjà renseignée n'est jamais écrasée.
-- =====================================================================

create temporary table _lieux2 (ville text, nom text, nom_ar text, type public.type_lieu, adresse text, telephone text, lien text, lat double precision, lng double precision);
insert into _lieux2 values
  ('la-marsa', 'Hello Mademoiselle', null, 'bar_restaurant', 'Gammarth', null, null, null, null),
  ('la-marsa', 'AINA', null, 'bar_restaurant', 'Gammarth', null, null, null, null),
  ('tunis', 'BSMNT Club', null, 'bar_restaurant', null, null, null, null, null),
  ('la-marsa', '117 Gammarth', null, 'bar_restaurant', 'Gammarth', null, null, null, null),
  ('la-marsa', 'Flō Gammarth', null, 'bar_restaurant', 'Gammarth', null, null, null, null),
  ('tunis', 'Eddisco', null, 'autre', null, null, 'https://eddisco.bandcamp.com', null, null),
  ('tunis', 'Lecurie', null, 'espace_alternatif', 'Rue d''Autriche, Tunis', null, null, null, null),
  ('la-marsa', 'Game Art Park (GAP)', null, 'espace_alternatif', 'Gammarth', null, null, null, null),
  ('la-marsa', 'Le Club de Gammarth', null, 'bar_restaurant', 'Zone touristique Cap Gammarth, 2070 Gammarth', null, null, null, null),
  ('la-marsa', 'Cultur''House Gammarth', null, 'autre', 'Route Express de Gammarth, La Marsa', null, null, null, null),
  ('tunis', 'Hôtel Belvédère Fourati', null, 'hotel', '10 Av. des Etats-Unis, 1002 Tunis', null, null, null, null),
  ('tunis', 'Caserne El Attarine', null, 'autre', 'Médina de Tunis', null, null, null, null),
  ('tunis', 'Madrasa El Mountaciriya', null, 'autre', 'Médina de Tunis', null, null, null, null),
  ('tunis', 'Zaouia Sidi Ali Chiha', null, 'autre', 'Médina de Tunis', null, null, null, null),
  ('tunis', 'Dar El Haddad', null, 'autre', 'Médina de Tunis', null, null, null, null),
  ('tunis', 'Centre culturel historique El Slimania', null, 'autre', 'Médina de Tunis', null, null, null, null),
  ('la-marsa', 'El Ksar – Palais Ahmed Bey', null, 'autre', null, null, null, null, null),
  ('carthage', 'Vérand''Art', null, 'espace_alternatif', 'Front de mer entre Carthage Salammbô et Le Kram', null, null, null, null),
  ('la-marsa', 'Hôtel Dar El Marsa', null, 'hotel', null, null, null, null, null),
  ('monastir', 'Hôtel Monastir Center', null, 'hotel', null, null, null, null, null),
  ('monastir', 'ONE Resort Aqua Park & Spa', null, 'hotel', null, null, null, null, null),
  ('monastir', 'Complexe touristique Marina Monastir', null, 'autre', null, null, null, null, null),
  ('hammamet', 'Hôtel Omar Khayyam', null, 'hotel', null, null, null, null, null),
  ('hammamet', 'Hôtel El Fell', null, 'hotel', null, null, null, null, null),
  ('tunis', 'Centre Afrique des Arts (Hôtel Africa)', null, 'espace_alternatif', 'Hôtel Africa, Tunis', null, null, null, null),
  ('djerba', 'Galerie Insular', null, 'galerie', 'Erriadh, Djerba', null, null, null, null),
  ('sfax', 'Galerie Hors Cadre', null, 'galerie', 'Palais des Foires de Sfax', null, null, null, null),
  ('sfax', 'Kiosque à musique de Sfax', null, 'autre', null, null, null, null, null),
  ('gabes', 'Café Cherchara', null, 'autre', 'Chenini, Gabès', null, null, null, null),
  ('sousse', 'Hard Rock Cafe Port El Kantaoui', null, 'bar_restaurant', 'Zone touristique El Kantaoui, 4089 Sousse', null, null, null, null),
  ('la-marsa', 'Galerie Alexandre Roubtzoff', null, 'galerie', null, null, null, null, null),
  ('la-marsa', 'TGM Gallery', null, 'galerie', null, null, null, null, null),
  ('tunis', 'Mouhit Space', null, 'espace_alternatif', '15 rue Chaambi, El Menzah 1', null, 'https://mouhit.space/', null, null),
  ('tunis', 'Galerie Yahia', null, 'galerie', null, null, null, null, null),
  ('tunis', 'Maison des Arts du Belvédère', null, 'galerie', 'Parc du Belvédère, Tunis', null, null, null, null),
  ('tunis', 'Espace Mass''Art', null, 'espace_alternatif', 'Bab Laassal, Tunis', null, null, null, null),
  ('tunis', 'Konbini', null, 'cafe_culturel', null, null, null, null, null),
  ('tunis', 'Cinéma Le Palace', null, 'cinema', 'Avenue Habib Bourguiba, Tunis', null, null, null, null),
  ('tunis', 'Cinéma Le Parnasse', null, 'cinema', 'Avenue Habib Bourguiba (à l''étage de l''immeuble Le Parnasse), Tunis', null, null, null, null),
  ('kairouan', 'Cinéma Dar Kairouan', null, 'cinema', 'Médina de Kairouan', null, null, null, null),
  ('tunis', 'Centre russe de science et de culture', null, 'centre_culturel', 'Quartier Lafayette, Tunis', null, null, null, null),
  ('ariana', 'Galerie Kalysté', null, 'galerie', 'La Soukra', null, 'https://www.instagram.com/galerie_kaly1', null, null),
  ('la-marsa', 'Isharat Gallery', null, 'galerie', 'Tanit Center, Sidi Daoud, La Marsa', null, null, null, null),
  ('tunis', 'La Boîte', null, 'galerie', null, null, null, null, null),
  ('ben-arous', 'Galerie des arts de Ben Arous', null, 'galerie', null, null, null, null, null),
  ('sfax', 'Galerie Gassin', null, 'galerie', 'Dahmanin, Bounouma, Kerkennah', null, null, null, null),
  ('djerba', 'Djerbahood', null, 'espace_alternatif', 'Erriadh (Hara Sghira), Djerba', null, null, null, null);

insert into public.lieu (ville_id, nom, nom_ar, type, adresse, telephone, lien, position)
select v.id, t.nom, t.nom_ar, t.type, t.adresse, t.telephone, t.lien,
       case when t.lat is not null and t.lng is not null
            then extensions.st_setsrid(extensions.st_makepoint(t.lng, t.lat), 4326)::extensions.geography end
  from _lieux2 t
  join public.ville v on v.slug = t.ville
 where not exists (select 1 from public.lieu l
                    where l.ville_id = v.id and public.normaliser(l.nom) = public.normaliser(t.nom));

create temporary table _gps (ville text, nom text, lat double precision, lng double precision);
insert into _gps values
  ('tunis', 'Cité de la Culture Chedly Klibi', 36.810848, 10.186087),
  ('tunis', 'Cité des Sciences à Tunis', 36.848257, 10.188841),
  ('tunis', 'Maison de la culture Ibn Rachiq', 36.801269, 10.180977),
  ('tunis', 'Le 4ème Art', 36.80189, 10.181234),
  ('tunis', 'Cinéma Le Colisée', 36.800137, 10.181887),
  ('tunis', 'Théâtre National Tunisien – Palais du Théâtre (Halfaouine)', 36.808716, 10.167688),
  ('tunis', 'El Teatro', 36.813644, 10.173811),
  ('tunis', '32Bis', 36.795086, 10.183802),
  ('tunis', 'Théâtre El Hamra', 36.796401, 10.175982),
  ('tunis', 'Le Mondial (espace théâtral et culturel)', 36.798753, 10.182708),
  ('tunis', 'CinéVog', 36.838399, 10.319065),
  ('tunis', 'British Council Tunisie', 36.821187, 10.180784),
  ('tunis', 'Institut français de Tunisie', 36.802276, 10.180634),
  ('tunis', 'Musée des arts et traditions populaires – Dar Ben Abdallah', 36.79398, 10.17373),
  ('tunis', 'Tourbet El Bey', 36.793656, 10.173116),
  ('tunis', 'Dar Hussein (Institut national du patrimoine)', 36.7953, 10.1708),
  ('tunis', 'Palais Kheireddine – Musée de la Ville de Tunis', 36.801677, 10.168466),
  ('tunis', 'Centre culturel Bir Lahjar', 36.800804, 10.167713),
  ('tunis', 'Mausolée Sidi Mehrez', 36.804668, 10.168851),
  ('tunis', 'Club culturel Tahar Haddad', 36.80185, 10.16768),
  ('tunis', 'Dar Lasram', 36.80185, 10.16768),
  ('carthage', 'Musée national de Carthage', 36.85357, 10.324298),
  ('carthage', 'CinéMadart', 36.849953, 10.326414),
  ('carthage', 'Théâtre romain de Carthage', 36.857819, 10.3295),
  ('carthage', 'Thermes d''Antonin', 36.854353, 10.335183),
  ('bizerte', 'Amphithéâtre du Fort d''Espagne (Festival international de Bizerte)', 37.28222, 9.87167),
  ('sousse', 'Théâtre de plein air Sidi Dhaher', 35.821673, 10.636342),
  ('hammamet', 'Centre culturel international de Hammamet – Dar Sebastian (théâtre de plein air)', 36.404219, 10.594646),
  ('tataouine', 'Ksar El Ferch (E-Fest)', 32.973532, 10.349817),
  ('tozeur', 'Ong Jmel (Dunes Électroniques)', 34.01608, 7.912341),
  ('ariana', 'Pathé Tunis City', 36.898277, 10.124512),
  ('ben-arous', 'Pathé Azur City', 36.726076, 10.256554),
  ('sousse', 'Pathé Mall of Sousse', 35.903326, 10.544184),
  ('tunis', 'Parc des expositions du Kram (Palais des Foires)', 36.839382, 10.301344),
  ('tunis', 'Mövenpick Hôtel du Lac Tunis', 36.835561, 10.248682),
  ('ariana', 'CinéJamil', 36.846592, 10.166955),
  ('la-marsa', 'Cinéma Alhambra (Zéphyr)', 36.883726, 10.333721),
  ('la-marsa', 'L''Agora (centre culturel et cinéma)', 36.881328, 10.325846),
  ('ben-arous', 'Centre des Arts Vivants de Radès', 36.76369, 10.264329),
  ('ariana', 'Le Boeuf sur le Toit', 36.875926, 10.245924),
  ('sidi-bou-said', 'Galerie A. Gorgi', 36.870951, 10.347005),
  ('la-marsa', 'Maison de la culture de Gammarth', 36.905942, 10.301285),
  ('nabeul', 'Maison de la culture de Nabeul', 36.442552, 10.72953),
  ('sfax', 'Dar Jallouli – Musée des arts et traditions populaires de Sfax', 34.737, 10.7621),
  ('tunis', 'Théâtre de l''Opéra de Tunis (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'Théâtre des Régions (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'Théâtre des Jeunes Créateurs (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'Cinémathèque tunisienne', 36.810848, 10.186087),
  ('tunis', 'Salle Tahar Cheriaa (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'Salle Sophie El Golli (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'Salle Omar Khlifi (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'Place des Théâtres (Cité de la Culture)', 36.810848, 10.186087),
  ('tunis', 'MACAM – Musée national d''art moderne et contemporain', 36.810848, 10.186087),
  ('tunis', 'Maison du Roman (Cité de la Culture)', 36.810848, 10.186087);

update public.lieu l
   set position = extensions.st_setsrid(extensions.st_makepoint(g.lng, g.lat), 4326)::extensions.geography
  from _gps g
  join public.ville v on v.slug = g.ville
 where l.ville_id = v.id
   and public.normaliser(l.nom) = public.normaliser(g.nom)
   and l.position is null;

drop table _lieux2, _gps;
