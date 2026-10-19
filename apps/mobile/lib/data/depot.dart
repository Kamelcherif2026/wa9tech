import 'package:supabase_flutter/supabase_flutter.dart';
import 'dates.dart';
import 'modeles.dart';

/// Critères de recherche (mêmes paramètres que la fonction SQL rechercher_evenements).
class Criteres {
  const Criteres({this.q, this.ville, this.categorieId, this.periode = Periode.aVenir, this.gratuit = false});
  final String? q;
  final String? ville; // slug
  final int? categorieId; // parent ou enfant
  final Periode periode;
  final bool gratuit;

  Criteres copie({String? q, String? ville, int? categorieId, Periode? periode, bool? gratuit, bool effacerVille = false, bool effacerCategorie = false}) =>
      Criteres(
        q: q ?? this.q,
        ville: effacerVille ? null : (ville ?? this.ville),
        categorieId: effacerCategorie ? null : (categorieId ?? this.categorieId),
        periode: periode ?? this.periode,
        gratuit: gratuit ?? this.gratuit,
      );

  @override
  bool operator ==(Object other) =>
      other is Criteres &&
      other.q == q &&
      other.ville == ville &&
      other.categorieId == categorieId &&
      other.periode == periode &&
      other.gratuit == gratuit;
  @override
  int get hashCode => Object.hash(q, ville, categorieId, periode, gratuit);
}

/// Accès aux données publiques. Lecture seule (clé publique + RLS : seuls les événements publiés sont visibles).
class Depot {
  Depot(this._sb);
  final SupabaseClient _sb;

  static const _selectFiche = '''id, slug, titre_fr, titre_ar, description_fr, description_ar, images, gratuit, prix_min, prix_max,
      infos_reservation, lien_externe, telephone_reservation, lieu_texte, verifie, prochaine_date, ville_id,
      categorie:categorie_id(id),
      lieu:lieu_id(slug, nom, nom_ar, adresse, lat, lng),
      organisateur:organisateur_id(nom),
      representations:representation(debut, fin, annulee),
      artistes:evenement_artiste(ordre, artiste:artiste_id(slug, nom, nom_ar))''';

  static const _selectCarte =
      'id, slug, titre_fr, titre_ar, images, categorie_id, ville_id, prochaine_date, gratuit, featured, lieu_texte, lieu:lieu_id(nom)';

  Future<Referentiels> referentiels() async {
    final res = await Future.wait([
      _sb.from('ville').select('id, slug, nom_fr, nom_ar').order('nom_fr'),
      _sb.from('categorie').select('id, slug, parent_id, libelle_fr, libelle_ar, ordre').order('ordre'),
    ]);
    return Referentiels(
      res[0].map(Ville.depuis).toList(),
      res[1].map(Categorie.depuis).toList(),
    );
  }

  Future<List<Carte>> rechercher(Criteres c, {int limite = 20, int decalage = 0}) async {
    final f = fenetre(c.periode);
    final data = await _sb.rpc('rechercher_evenements', params: {
      'p_q': (c.q ?? '').trim().isEmpty ? null : c.q!.trim(),
      'p_ville': c.ville,
      'p_categories': c.categorieId == null ? null : [c.categorieId],
      'p_debut': f.debut.toIso8601String(),
      'p_fin': f.fin?.toIso8601String(),
      'p_gratuit': c.gratuit ? true : null,
      'p_limite': limite,
      'p_decalage': decalage,
    });
    return (data as List).cast<Map<String, dynamic>>().map(Carte.depuis).toList();
  }

  /// Sections de l'accueil.
  Future<({List<Carte> aLaUne, List<Carte> aujourdhui, List<Carte> weekend, List<Carte> bientot})> accueil() async {
    final r = await Future.wait([
      rechercher(const Criteres(periode: Periode.aujourdhui), limite: 10),
      rechercher(const Criteres(periode: Periode.weekend), limite: 10),
      rechercher(const Criteres(periode: Periode.mois), limite: 20),
    ]);
    final bientot = r[2];
    // À la une : mis en avant par l'équipe, complétés par les prochains événements qui ont une affiche
    final aLaUne = [...bientot.where((c) => c.featured), ...bientot.where((c) => !c.featured && c.image != null)].take(5).toList();
    return (aLaUne: aLaUne, aujourdhui: r[0], weekend: r[1], bientot: bientot);
  }

  /// Événements autour d'un point, du plus proche au plus lointain (100 au plus).
  Future<List<Proche>> proches({required double lat, required double lng, required int rayonKm, required Periode periode}) async {
    final f = fenetre(periode);
    final data = await _sb.rpc('evenements_proches', params: {
      'p_lat': lat,
      'p_lng': lng,
      'p_rayon_km': rayonKm,
      'p_debut': f.debut.toIso8601String(),
      'p_fin': f.fin?.toIso8601String(),
      'p_limite': 100,
    });
    return (data as List).cast<Map<String, dynamic>>().where((j) => j['lat'] != null && j['lng'] != null).map(Proche.depuis).toList();
  }

  /// Cartes à jour des événements mis de côté (Mes sorties). Seuls les événements encore publiés reviennent.
  Future<List<Carte>> cartesParIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    final data = await _sb.from('evenement').select(_selectCarte).inFilter('id', ids);
    return data.map(Carte.depuis).toList();
  }

  Future<Fiche?> fiche(String slug) async {
    final j = await _sb
        .from('evenement')
        .select(_selectFiche)
        .eq('slug', slug)
        .order('debut', referencedTable: 'representation')
        .maybeSingle();
    return j == null ? null : Fiche.depuis(j);
  }

  Future<List<Carte>> similaires(String id) async {
    final data = await _sb.rpc('evenements_similaires', params: {'p_evenement': id, 'p_limite': 6});
    return (data as List).cast<Map<String, dynamic>>().map(Carte.depuis).toList();
  }

  /// Statistiques anonymes (vue d'une fiche). Les erreurs sont ignorées.
  Future<void> compterVue(String id) async {
    try {
      await _sb.rpc('compter_vue', params: {'p_evenement': id});
    } catch (_) {}
  }

  Future<void> compterClicReservation(String id) async {
    try {
      await _sb.rpc('compter_clic_reservation', params: {'p_evenement': id});
    } catch (_) {}
  }

  Future<({Entite lieu, List<Carte> cartes})?> lieu(String slug) async {
    final l = await _sb
        .from('lieu')
        .select('id, slug, nom, nom_ar, adresse, telephone, lien, lat, lng, ville_id')
        .eq('slug', slug)
        .maybeSingle();
    if (l == null) return null;
    final evts = await _sb
        .from('evenement')
        .select(_selectCarte)
        .eq('lieu_id', l['id'] as String)
        .eq('statut', 'publie')
        .not('prochaine_date', 'is', null)
        .order('prochaine_date')
        .limit(48);
    return (
      lieu: Entite(
        id: l['id'] as String,
        slug: l['slug'] as String,
        nom: l['nom'] as String,
        nomAr: l['nom_ar'] as String?,
        adresse: l['adresse'] as String?,
        telephone: l['telephone'] as String?,
        lien: l['lien'] as String?,
        lat: (l['lat'] as num?)?.toDouble(),
        lng: (l['lng'] as num?)?.toDouble(),
        villeId: l['ville_id'] as int?,
      ),
      cartes: evts.map(Carte.depuis).toList(),
    );
  }

  Future<({Entite artiste, List<Carte> cartes})?> artiste(String slug) async {
    final a = await _sb.from('artiste').select('id, slug, nom, nom_ar, lien, discipline_id').eq('slug', slug).maybeSingle();
    if (a == null) return null;
    final evts = await _sb
        .from('evenement')
        .select('$_selectCarte, evenement_artiste!inner(artiste_id)')
        .eq('evenement_artiste.artiste_id', a['id'] as String)
        .eq('statut', 'publie')
        .not('prochaine_date', 'is', null)
        .order('prochaine_date')
        .limit(48);
    return (
      artiste: Entite(
        id: a['id'] as String,
        slug: a['slug'] as String,
        nom: a['nom'] as String,
        nomAr: a['nom_ar'] as String?,
        lien: a['lien'] as String?,
        disciplineId: a['discipline_id'] as int?,
      ),
      cartes: evts.map(Carte.depuis).toList(),
    );
  }
}
