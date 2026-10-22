import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'config.dart';
import 'data/favoris.dart';
import 'providers.dart';
import 'services/rappels.dart';

Future<void> main() async {
  // Toute erreur, même hors de Flutter, est affichée à l'écran au lieu de laisser une page blanche.
  // Avant l'affichage de l'application seulement : ensuite, une erreur isolée ne doit pas tout remplacer.
  runZonedGuarded(_demarrer, (erreur, pile) {
    if (!_demarre) runApp(_ErreurDemarrage('$erreur'));
  });
}

bool _demarre = false;

Future<void> _demarrer() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!Config.estConfigure) {
    runApp(const _ConfigManquante());
    return;
  }

  try {
    await Supabase.initialize(url: Config.supabaseUrl, publishableKey: Config.supabaseCle)
        .timeout(const Duration(seconds: 20));
  } catch (e) {
    runApp(_ErreurDemarrage('Supabase : $e'));
    return;
  }
  final SharedPreferences prefs;
  try {
    prefs = await SharedPreferences.getInstance().timeout(const Duration(seconds: 10));
  } catch (e) {
    runApp(_ErreurDemarrage('Préférences : $e'));
    return;
  }
  final conteneur = ProviderContainer(overrides: [prefsProvider.overrideWithValue(prefs)]);

  // L'interface s'affiche d'abord ; les rappels se préparent ensuite (jamais bloquants)
  runApp(UncontrolledProviderScope(container: conteneur, child: const WaApp()));
  _demarre = true;

  // Rappels : toucher une notification ouvre la fiche de l'événement
  final rappels = conteneur.read(rappelsProvider);
  await rappels.initialiser((slug) => routeur.push('/evenement/$slug')).timeout(const Duration(seconds: 10), onTimeout: () {});
  final slug = rappels.slugAuDemarrage;
  if (slug != null) routeur.push('/evenement/$slug');

  // Dates à jour des sorties enregistrées et rappels reprogrammés, en arrière-plan
  unawaited(conteneur.read(favorisProvider.notifier).synchroniser(conteneur.read(langueProvider)));
}

/// Écran affiché si le démarrage échoue : le message aide à trouver la cause (capture d'écran).
class _ErreurDemarrage extends StatelessWidget {
  const _ErreurDemarrage(this.message);
  final String message;

  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: ListView(
                children: [
                  const Text('WA9TECH ne peut pas démarrer', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  const Text('Faites une capture de cet écran et envoyez-la à l\'équipe.'),
                  const SizedBox(height: 16),
                  SelectableText(message, style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
                ],
              ),
            ),
          ),
        ),
      );
}

/// Affiché si l'application a été lancée sans --dart-define-from-file (aide au développement).
class _ConfigManquante extends StatelessWidget {
  const _ConfigManquante();

  @override
  Widget build(BuildContext context) => const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Configuration manquante.\nLancez : flutter run --dart-define-from-file=env/staging.json',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      );
}
