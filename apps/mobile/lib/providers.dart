import 'dart:ui' show PlatformDispatcher;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'data/depot.dart';
import 'data/modeles.dart';

final depotProvider = Provider<Depot>((ref) => Depot(Supabase.instance.client));

/// Langue de l'application : celle du téléphone au départ (arabe ou français), modifiable.
class LangueNotifier extends Notifier<String> {
  @override
  String build() => PlatformDispatcher.instance.locale.languageCode == 'ar' ? 'ar' : 'fr';

  void basculer() => state = state == 'ar' ? 'fr' : 'ar';
}

final langueProvider = NotifierProvider<LangueNotifier, String>(LangueNotifier.new);

final referentielsProvider = FutureProvider<Referentiels>((ref) => ref.watch(depotProvider).referentiels());

final accueilProvider = FutureProvider((ref) => ref.watch(depotProvider).accueil());

final ficheProvider = FutureProvider.family<Fiche?, String>((ref, slug) => ref.watch(depotProvider).fiche(slug));

final similairesProvider = FutureProvider.family<List<Carte>, String>((ref, id) => ref.watch(depotProvider).similaires(id));

final lieuProvider = FutureProvider.family<({Entite lieu, List<Carte> cartes})?, String>(
  (ref, slug) => ref.watch(depotProvider).lieu(slug),
);

final artisteProvider = FutureProvider.family<({Entite artiste, List<Carte> cartes})?, String>(
  (ref, slug) => ref.watch(depotProvider).artiste(slug),
);

/// Liste simple (page ville / catégorie, 60 premiers résultats).
final listeProvider = FutureProvider.family<List<Carte>, Criteres>(
  (ref, c) => ref.watch(depotProvider).rechercher(c, limite: 60),
);
