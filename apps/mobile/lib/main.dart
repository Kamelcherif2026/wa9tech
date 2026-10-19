import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!Config.estConfigure) {
    runApp(const _ConfigManquante());
    return;
  }

  await Supabase.initialize(url: Config.supabaseUrl, publishableKey: Config.supabaseCle);
  runApp(const ProviderScope(child: WaApp()));
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
