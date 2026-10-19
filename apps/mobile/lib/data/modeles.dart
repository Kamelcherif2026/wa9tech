/// Modèles lus depuis Supabase (mêmes champs que le site).
library;

DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());
double? _nombre(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

class Ville {
  Ville({required this.id, required this.slug, required this.nomFr, required this.nomAr});
  final int id;
  final String slug, nomFr, nomAr;
  String nom(String l) => l == 'ar' ? nomAr : nomFr;
  factory Ville.depuis(Map<String, dynamic> j) =>
      Ville(id: j['id'] as int, slug: j['slug'] as String, nomFr: j['nom_fr'] as String, nomAr: j['nom_ar'] as String);
}

class Categorie {
  Categorie({required this.id, required this.slug, this.parentId, required this.libelleFr, required this.libelleAr});
  final int id;
  final String slug, libelleFr, libelleAr;
  final int? parentId;
  String libelle(String l) => l == 'ar' ? libelleAr : libelleFr;
  factory Categorie.depuis(Map<String, dynamic> j) => Categorie(
        id: j['id'] as int,
        slug: j['slug'] as String,
        parentId: j['parent_id'] as int?,
        libelleFr: j['libelle_fr'] as String,
        libelleAr: j['libelle_ar'] as String,
      );
}

/// Référentiels (villes, catégories) chargés une fois au démarrage.
class Referentiels {
  Referentiels(this.villes, this.categories);
  final List<Ville> villes;
  final List<Categorie> categories;

  List<Categorie> get disciplines => categories.where((c) => c.parentId == null).toList();
  Ville? ville(int? id) {
    for (final v in villes) {
      if (v.id == id) return v;
    }
    return null;
  }

  Categorie? categorie(int? id) {
    for (final c in categories) {
      if (c.id == id) return c;
    }
    return null;
  }

  /// Discipline (catégorie parente) d'une catégorie.
  Categorie? discipline(int? id) {
    final c = categorie(id);
    return c?.parentId != null ? categorie(c!.parentId) : c;
  }

  /// Index de couleur d'une discipline (même ordre que les tuiles du site).
  int indexTeinte(int? categorieId) {
    final d = discipline(categorieId);
    final i = disciplines.indexWhere((x) => x.id == d?.id);
    return i < 0 ? 0 : i % 5; // 5 teintes, réutilisées en boucle (voir theme.dart)
  }
}

/// Carte d'événement (listes).
class Carte {
  Carte({
    required this.id,
    required this.slug,
    required this.titreFr,
    this.titreAr,
    this.image,
    this.categorieId,
    this.villeId,
    this.lieuNom,
    this.prochaineDate,
    this.gratuit = false,
    this.featured = false,
    this.total = 0,
  });
  final String id, slug, titreFr;
  final String? titreAr, image, lieuNom;
  final int? categorieId, villeId;
  final DateTime? prochaineDate;
  final bool gratuit, featured;
  final int total;

  String titre(String l) => (l == 'ar' && (titreAr ?? '').isNotEmpty) ? titreAr! : titreFr;

  factory Carte.depuis(Map<String, dynamic> j) {
    final images = j['images'];
    final lieu = j['lieu'];
    return Carte(
      id: j['id'] as String,
      slug: j['slug'] as String,
      titreFr: j['titre_fr'] as String,
      titreAr: j['titre_ar'] as String?,
      image: (j['image'] as String?) ?? (images is List && images.isNotEmpty ? images.first as String : null),
      categorieId: j['categorie_id'] as int?,
      villeId: j['ville_id'] as int?,
      lieuNom: (j['lieu_nom'] as String?) ?? (lieu is Map ? lieu['nom'] as String? : null) ?? j['lieu_texte'] as String?,
      prochaineDate: _date(j['prochaine_date']),
      gratuit: (j['gratuit'] as bool?) ?? false,
      featured: (j['featured'] as bool?) ?? false,
      total: (j['total'] as num?)?.toInt() ?? 0,
    );
  }
}

class Representation {
  Representation(this.debut, this.fin, this.annulee);
  final DateTime debut;
  final DateTime? fin;
  final bool annulee;
}

class ArtisteLien {
  ArtisteLien(this.slug, this.nom, this.nomAr, this.ordre);
  final String slug, nom;
  final String? nomAr;
  final int ordre;
  String nomAffiche(String l) => (l == 'ar' && (nomAr ?? '').isNotEmpty) ? nomAr! : nom;
}

/// Fiche complète d'un événement.
class Fiche {
  Fiche({
    required this.id,
    required this.slug,
    required this.titreFr,
    this.titreAr,
    this.descriptionFr,
    this.descriptionAr,
    required this.images,
    required this.gratuit,
    this.prixMin,
    this.prixMax,
    this.infosReservation,
    this.lienExterne,
    this.telephone,
    this.lieuTexte,
    required this.verifie,
    this.prochaineDate,
    this.categorieId,
    this.lieuSlug,
    this.lieuNom,
    this.lieuNomAr,
    this.lieuAdresse,
    this.lat,
    this.lng,
    this.villeId,
    this.organisateur,
    required this.representations,
    required this.artistes,
  });

  final String id, slug, titreFr;
  final String? titreAr, descriptionFr, descriptionAr, infosReservation, lienExterne, telephone, lieuTexte;
  final List<String> images;
  final bool gratuit, verifie;
  final double? prixMin, prixMax, lat, lng;
  final DateTime? prochaineDate;
  final int? categorieId, villeId;
  final String? lieuSlug, lieuNom, lieuNomAr, lieuAdresse, organisateur;
  final List<Representation> representations;
  final List<ArtisteLien> artistes;

  String titre(String l) => (l == 'ar' && (titreAr ?? '').isNotEmpty) ? titreAr! : titreFr;
  String? description(String l) => (l == 'ar' && (descriptionAr ?? '').isNotEmpty) ? descriptionAr : descriptionFr;
  String? nomLieu(String l) => lieuNom != null ? ((l == 'ar' && (lieuNomAr ?? '').isNotEmpty) ? lieuNomAr : lieuNom) : lieuTexte;

  factory Fiche.depuis(Map<String, dynamic> j) {
    final lieu = j['lieu'] as Map<String, dynamic>?;
    final ville = j['ville'] as Map<String, dynamic>?;
    final cat = j['categorie'] as Map<String, dynamic>?;
    final orga = j['organisateur'] as Map<String, dynamic>?;
    final reps = (j['representations'] as List? ?? [])
        .cast<Map<String, dynamic>>()
        .map((r) => Representation(DateTime.parse(r['debut'] as String), _date(r['fin']), (r['annulee'] as bool?) ?? false))
        .where((r) => !r.annulee)
        .toList()
      ..sort((a, b) => a.debut.compareTo(b.debut));
    final arts = (j['artistes'] as List? ?? [])
        .cast<Map<String, dynamic>>()
        .where((x) => x['artiste'] != null)
        .map((x) {
          final a = x['artiste'] as Map<String, dynamic>;
          return ArtisteLien(a['slug'] as String, a['nom'] as String, a['nom_ar'] as String?, (x['ordre'] as num?)?.toInt() ?? 0);
        })
        .toList()
      ..sort((a, b) => a.ordre.compareTo(b.ordre));
    return Fiche(
      id: j['id'] as String,
      slug: j['slug'] as String,
      titreFr: j['titre_fr'] as String,
      titreAr: j['titre_ar'] as String?,
      descriptionFr: j['description_fr'] as String?,
      descriptionAr: j['description_ar'] as String?,
      images: (j['images'] as List? ?? []).cast<String>(),
      gratuit: (j['gratuit'] as bool?) ?? false,
      prixMin: _nombre(j['prix_min']),
      prixMax: _nombre(j['prix_max']),
      infosReservation: j['infos_reservation'] as String?,
      lienExterne: j['lien_externe'] as String?,
      telephone: j['telephone_reservation'] as String?,
      lieuTexte: j['lieu_texte'] as String?,
      verifie: (j['verifie'] as bool?) ?? false,
      prochaineDate: _date(j['prochaine_date']),
      categorieId: cat?['id'] as int?,
      lieuSlug: lieu?['slug'] as String?,
      lieuNom: lieu?['nom'] as String?,
      lieuNomAr: lieu?['nom_ar'] as String?,
      lieuAdresse: lieu?['adresse'] as String?,
      lat: _nombre(lieu?['lat']),
      lng: _nombre(lieu?['lng']),
      villeId: (j['ville_id'] as int?) ?? (ville?['id'] as int?),
      organisateur: orga?['nom'] as String?,
      representations: reps,
      artistes: arts,
    );
  }
}

/// En-tête d'une page lieu ou artiste.
class Entite {
  Entite({required this.id, required this.slug, required this.nom, this.nomAr, this.adresse, this.telephone, this.lien, this.lat, this.lng, this.villeId, this.disciplineId});
  final String id, slug, nom;
  final String? nomAr, adresse, telephone, lien;
  final double? lat, lng;
  final int? villeId, disciplineId;
  String nomAffiche(String l) => (l == 'ar' && (nomAr ?? '').isNotEmpty) ? nomAr! : nom;
}
