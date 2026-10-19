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
  WidgetsFlutterBinding.ensureInitialized();

  if (!Config.estConfigure) {
    runApp(const _ConfigManquante());
    return;
  }

  await Supabase.initialize(url: Config.supabaseUrl, publishableKey: Config.supabaseCle);
  final prefs = await SharedPreferences.getInstance();
  final conteneur = ProviderContainer(overrides: [prefsProvider.overrideWithValue(prefs)]);

  // Rappels : toucher une notification ouvre la fiche de l'événement
  final rappels = conteneur.read(rappelsProvider);
  await rappels.initialiser((slug) => routeur.push('/evenement/$slug'));

  runApp(UncontrolledProviderScope(container: conteneur, child: const WaApp()));

  final slug = rappels.slugAuDemarrage;
  if (slug != null) routeur.push('/evenement/$slug');

  // Dates à jour des sorties enregistrées et rappels reprogrammés, en arrière-plan
  unawaited(conteneur.read(favorisProvider.notifier).synchroniser(conteneur.read(langueProvider)));
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
