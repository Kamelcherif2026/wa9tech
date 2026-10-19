import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../providers.dart';
import '../services/rappels.dart';
import 'dates.dart';
import 'modeles.dart';

/// Moments possibles pour un rappel.
enum Rappel {
  /// La veille de la sortie, à 18 h (heure de Tunis).
  veille,

  /// Trois heures avant le début.
  avant3h,
}

/// Instants (UTC) des rappels d'une sortie qui commence à [debut].
/// Les rappels déjà passés par rapport à [maintenant] sont écartés.
List<({Rappel rappel, DateTime quand})> instantsRappel(DateTime debut, Set<Rappel> rappels, [DateTime? maintenant]) {
  final now = (maintenant ?? DateTime.now()).toUtc();
  final t = versTunis(debut);
  final liste = <({Rappel rappel, DateTime quand})>[];
  for (final r in Rappel.values) {
    if (!rappels.contains(r)) continue;
    final quand = switch (r) {
      Rappel.veille => depuisTunis(t.year, t.month, t.day - 1, 18),
      Rappel.avant3h => debut.toUtc().subtract(const Duration(hours: 3)),
    };
    if (quand.isAfter(now)) liste.add((rappel: r, quand: quand));
  }
  return liste;
}

/// Un événement mis de côté par l'utilisateur. Une copie des informations utiles est gardée sur le
/// téléphone : « Mes sorties » s'affiche même sans connexion. Elle est rafraîchie depuis le serveur.
class Favori {
  const Favori({required this.carte, this.rappels = const {}});
  final Carte carte;
  final Set<Rappel> rappels;

  String get id => carte.id;

  Favori avec({Carte? carte, Set<Rappel>? rappels}) => Favori(carte: carte ?? this.carte, rappels: rappels ?? this.rappels);

  Map<String, dynamic> versJson() => {
        'id': carte.id,
        'slug': carte.slug,
        'titre_fr': carte.titreFr,
        'titre_ar': carte.titreAr,
        'image': carte.image,
        'categorie_id': carte.categorieId,
        'ville_id': carte.villeId,
        'lieu_nom': carte.lieuNom,
        'prochaine_date': carte.prochaineDate?.toUtc().toIso8601String(),
        'gratuit': carte.gratuit,
        'rappels': [for (final r in rappels) r.name],
      };

  factory Favori.depuisJson(Map<String, dynamic> j) => Favori(
        carte: Carte.depuis(j),
        rappels: {
          for (final n in (j['rappels'] as List? ?? []).cast<String>())
            ...Rappel.values.where((r) => r.name == n),
        },
      );
}

/// Préférences du téléphone, chargées une fois au démarrage (main.dart).
final prefsProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError('prefsProvider non initialisé'));

/// Mes sorties : événements favoris, rangés par identifiant.
class FavorisNotifier extends Notifier<Map<String, Favori>> {
  static const _cle = 'favoris_v1';

  SharedPreferences get _prefs => ref.read(prefsProvider);
  Rappels get _rappels => ref.read(rappelsProvider);

  @override
  Map<String, Favori> build() {
    final brut = _prefs.getString(_cle);
    if (brut == null) return {};
    try {
      final liste = (jsonDecode(brut) as List).cast<Map<String, dynamic>>().map(Favori.depuisJson);
      return {for (final f in liste) f.id: f};
    } catch (_) {
      return {}; // données illisibles : on repart de zéro plutôt que de bloquer l'application
    }
  }

  Future<void> _enregistrer(Map<String, Favori> m) async {
    state = m;
    await _prefs.setString(_cle, jsonEncode([for (final f in m.values) f.versJson()]));
  }

  bool contient(String id) => state.containsKey(id);

  /// Ajoute ou retire des favoris. Retirer annule aussi les rappels.
  Future<void> basculer(Carte c) async {
    final m = {...state};
    final existant = m.remove(c.id);
    if (existant != null) {
      await _rappels.annuler(existant);
    } else {
      m[c.id] = Favori(carte: c);
    }
    await _enregistrer(m);
  }

  /// Choisit les rappels d'une sortie (l'ajoute aux favoris si besoin) et les programme.
  Future<void> definirRappels(Carte c, Set<Rappel> rappels, String langue) async {
    final m = {...state};
    final f = (m[c.id] ?? Favori(carte: c)).avec(carte: c, rappels: rappels);
    m[c.id] = f;
    await _enregistrer(m);
    await _rappels.programmer(f, langue);
  }

  /// Rafraîchit les copies depuis le serveur (dates modifiées, titre corrigé…) et reprogramme les rappels.
  /// Sans connexion, les copies existantes restent affichées.
  Future<void> synchroniser(String langue) async {
    if (state.isEmpty) return;
    final List<Carte> fraiches;
    try {
      fraiches = await ref.read(depotProvider).cartesParIds(state.keys.toList());
    } catch (_) {
      return;
    }
    final m = {...state};
    for (final c in fraiches) {
      final f = m[c.id];
      if (f != null) m[c.id] = f.avec(carte: c);
    }
    await _enregistrer(m);
    for (final f in m.values) {
      if (f.rappels.isNotEmpty) await _rappels.programmer(f, langue);
    }
  }
}

final favorisProvider = NotifierProvider<FavorisNotifier, Map<String, Favori>>(FavorisNotifier.new);
