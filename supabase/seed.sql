-- =====================================================================
-- WA9TECH — Données de départ : villes et catégories
-- Coordonnées : centres-villes approximatifs (à affiner si besoin)
-- =====================================================================

insert into public.ville (slug, nom_fr, nom_ar, gouvernorat, position) values
  -- 24 chefs-lieux de gouvernorat
  ('tunis',        'Tunis',        'تونس',        'Tunis',       'SRID=4326;POINT(10.1815 36.8065)'),
  ('ariana',       'Ariana',       'أريانة',      'Ariana',      'SRID=4326;POINT(10.1956 36.8625)'),
  ('ben-arous',    'Ben Arous',    'بن عروس',     'Ben Arous',   'SRID=4326;POINT(10.2189 36.7531)'),
  ('manouba',      'La Manouba',   'منوبة',       'Manouba',     'SRID=4326;POINT(10.0972 36.8081)'),
  ('nabeul',       'Nabeul',       'نابل',        'Nabeul',      'SRID=4326;POINT(10.7376 36.4561)'),
  ('zaghouan',     'Zaghouan',     'زغوان',       'Zaghouan',    'SRID=4326;POINT(10.1429 36.4029)'),
  ('bizerte',      'Bizerte',      'بنزرت',       'Bizerte',     'SRID=4326;POINT(9.8739 37.2744)'),
  ('beja',         'Béja',         'باجة',        'Béja',        'SRID=4326;POINT(9.1817 36.7256)'),
  ('jendouba',     'Jendouba',     'جندوبة',      'Jendouba',    'SRID=4326;POINT(8.7802 36.5011)'),
  ('le-kef',       'Le Kef',       'الكاف',       'Le Kef',      'SRID=4326;POINT(8.7148 36.1822)'),
  ('siliana',      'Siliana',      'سليانة',      'Siliana',     'SRID=4326;POINT(9.3708 36.0849)'),
  ('sousse',       'Sousse',       'سوسة',        'Sousse',      'SRID=4326;POINT(10.6360 35.8256)'),
  ('monastir',     'Monastir',     'المنستير',    'Monastir',    'SRID=4326;POINT(10.8113 35.7643)'),
  ('mahdia',       'Mahdia',       'المهدية',     'Mahdia',      'SRID=4326;POINT(11.0622 35.5047)'),
  ('sfax',         'Sfax',         'صفاقس',       'Sfax',        'SRID=4326;POINT(10.7603 34.7406)'),
  ('kairouan',     'Kairouan',     'القيروان',    'Kairouan',    'SRID=4326;POINT(10.0963 35.6781)'),
  ('kasserine',    'Kasserine',    'القصرين',     'Kasserine',   'SRID=4326;POINT(8.8365 35.1676)'),
  ('sidi-bouzid',  'Sidi Bouzid',  'سيدي بوزيد',  'Sidi Bouzid', 'SRID=4326;POINT(9.4849 35.0382)'),
  ('gabes',        'Gabès',        'قابس',        'Gabès',       'SRID=4326;POINT(10.0982 33.8815)'),
  ('medenine',     'Médenine',     'مدنين',       'Médenine',    'SRID=4326;POINT(10.5055 33.3549)'),
  ('tataouine',    'Tataouine',    'تطاوين',      'Tataouine',   'SRID=4326;POINT(10.4518 32.9297)'),
  ('gafsa',        'Gafsa',        'قفصة',        'Gafsa',       'SRID=4326;POINT(8.7842 34.4250)'),
  ('tozeur',       'Tozeur',       'توزر',        'Tozeur',      'SRID=4326;POINT(8.1335 33.9197)'),
  ('kebili',       'Kébili',       'قبلي',        'Kébili',      'SRID=4326;POINT(8.9690 33.7044)'),
  -- Villes culturelles importantes
  ('la-marsa',     'La Marsa',     'المرسى',      'Tunis',       'SRID=4326;POINT(10.3247 36.8782)'),
  ('carthage',     'Carthage',     'قرطاج',       'Tunis',       'SRID=4326;POINT(10.3233 36.8528)'),
  ('sidi-bou-said','Sidi Bou Saïd','سيدي بوسعيد', 'Tunis',       'SRID=4326;POINT(10.3417 36.8687)'),
  ('hammamet',     'Hammamet',     'الحمامات',    'Nabeul',      'SRID=4326;POINT(10.6167 36.4000)'),
  ('djerba',       'Djerba',       'جربة',        'Médenine',    'SRID=4326;POINT(10.8575 33.8750)'),
  ('tabarka',      'Tabarka',      'طبرقة',       'Jendouba',    'SRID=4326;POINT(8.7581 36.9544)'),
  ('el-jem',       'El Jem',       'الجم',        'Mahdia',      'SRID=4326;POINT(10.7128 35.2964)'),
  ('douz',         'Douz',         'دوز',         'Kébili',      'SRID=4326;POINT(9.0167 33.4667)');

-- Catégories parentes
insert into public.categorie (slug, libelle_fr, libelle_ar, icone, ordre) values
  ('musique',      'Musique',          'موسيقى',         'music',        1),
  ('theatre',      'Théâtre',          'مسرح',           'drama',        2),
  ('cinema',       'Cinéma',           'سينما',          'film',         3),
  ('arts-visuels', 'Arts visuels',     'فنون تشكيلية',   'palette',      4),
  ('danse',        'Danse',            'رقص',            'footprints',   5),
  ('festivals',    'Festivals',        'مهرجانات',       'party-popper', 6),
  ('rencontres',   'Rencontres',       'لقاءات',         'mic',          7),
  ('ateliers',     'Ateliers',         'ورشات',          'hammer',       8),
  ('patrimoine',   'Patrimoine',       'تراث',           'landmark',     9),
  ('jeune-public', 'Jeune public',     'للأطفال',        'baby',         10);

-- Sous-catégories
insert into public.categorie (slug, parent_id, libelle_fr, libelle_ar, ordre)
select s.slug, p.id, s.fr, s.ar, s.ordre
  from (values
    ('concert',               'musique',      'Concert',                     'حفل موسيقي',           1),
    ('live',                  'musique',      'Live bar & resto',            'عرض حي',               2),
    ('scene-ouverte',         'musique',      'Scène ouverte',               'ركح مفتوح',            3),
    ('dj-set',                'musique',      'DJ set',                      'دي جي',                4),
    ('musique-traditionnelle','musique',      'Musique traditionnelle',      'موسيقى تقليدية',       5),
    ('piece-theatre',         'theatre',      'Pièce de théâtre',            'مسرحية',               1),
    ('humour',                'theatre',      'Humour / One-man-show',       'عرض فكاهي',            2),
    ('theatre-de-rue',        'theatre',      'Théâtre de rue',              'مسرح الشارع',          3),
    ('film-a-l-affiche',      'cinema',       'Film à l''affiche',           'أفلام في القاعات',     1),
    ('film-tunisien',         'cinema',       'Film tunisien',               'فيلم تونسي',           2),
    ('cine-club',             'cinema',       'Ciné-club',                   'نادي سينما',           3),
    ('projection-debat',      'cinema',       'Projection-débat',            'عرض ونقاش',            4),
    ('exposition',            'arts-visuels', 'Exposition',                  'معرض',                 1),
    ('vernissage',            'arts-visuels', 'Vernissage',                  'افتتاح معرض',          2),
    ('street-art',            'arts-visuels', 'Street art',                  'فن الشارع',            3),
    ('photographie',          'arts-visuels', 'Photographie',                'تصوير فوتوغرافي',      4),
    ('spectacle-danse',       'danse',        'Spectacle de danse',          'عرض رقص',              1),
    ('soiree-danse',          'danse',        'Soirée dansante',             'سهرة راقصة',           2),
    ('festival',              'festivals',    'Festival',                    'مهرجان',               1),
    ('festival-independant',  'festivals',    'Festival indépendant / underground', 'مهرجان مستقل', 2),
    ('conference',            'rencontres',   'Conférence',                  'محاضرة',               1),
    ('lecture',               'rencontres',   'Lecture / Littérature',       'قراءات وأدب',          2),
    ('debat',                 'rencontres',   'Débat',                       'نقاش',                 3),
    ('atelier',               'ateliers',     'Atelier',                     'ورشة',                 1),
    ('masterclass',           'ateliers',     'Masterclass',                 'درس متقدم',            2),
    ('residence-ouverte',     'ateliers',     'Résidence ouverte',           'إقامة فنية مفتوحة',    3),
    ('visite',                'patrimoine',   'Visite',                      'زيارة',                1),
    ('fete-traditionnelle',   'patrimoine',   'Fête traditionnelle',         'احتفال تقليدي',        2),
    ('journees-patrimoine',   'patrimoine',   'Journées du patrimoine',      'أيام التراث',          3),
    ('spectacle-enfant',      'jeune-public', 'Spectacle pour enfants',      'عرض للأطفال',          1),
    ('atelier-enfant',        'jeune-public', 'Atelier pour enfants',        'ورشة للأطفال',         2)
  ) as s(slug, parent, fr, ar, ordre)
  join public.categorie p on p.slug = s.parent;
