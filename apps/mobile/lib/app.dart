import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'i18n.dart';
import 'providers.dart';
import 'theme.dart';
import 'ui/pages/accueil_page.dart';
import 'ui/pages/agenda_page.dart';
import 'ui/pages/autour_page.dart';
import 'ui/pages/fiche_page.dart';
import 'ui/pages/liste_page.dart';
import 'ui/pages/proposer_page.dart';
import 'ui/pages/sorties_page.dart';

/// Routeur de l'application (aussi utilisé pour ouvrir une fiche depuis un rappel).
final routeur = GoRouter(
  routes: [
    ShellRoute(
      builder: (context, state, child) => _Coquille(chemin: state.uri.path, child: child),
      routes: [
        GoRoute(path: '/', builder: (context, state) => const AccueilPage()),
        GoRoute(path: '/autour', builder: (context, state) => const AutourPage()),
        GoRoute(path: '/sorties', builder: (context, state) => const SortiesPage()),
        GoRoute(
          path: '/agenda',
          builder: (context, state) => AgendaPage(
            q: state.uri.queryParameters['q'],
            periode: state.uri.queryParameters['quand'],
          ),
        ),
      ],
    ),
    GoRoute(path: '/proposer', builder: (context, s) => const ProposerPage()),
    GoRoute(path: '/evenement/:slug', builder: (context, s) => FichePage(slug: s.pathParameters['slug']!)),
    GoRoute(path: '/ville/:slug', builder: (context, s) => PageVille(slug: s.pathParameters['slug']!)),
    GoRoute(path: '/categorie/:id', builder: (context, s) => PageCategorie(id: int.parse(s.pathParameters['id']!))),
    GoRoute(path: '/lieu/:slug', builder: (context, s) => PageLieu(slug: s.pathParameters['slug']!)),
    GoRoute(path: '/artiste/:slug', builder: (context, s) => PageArtiste(slug: s.pathParameters['slug']!)),
  ],
);

class WaApp extends ConsumerWidget {
  const WaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final langue = ref.watch(langueProvider);
    return MaterialApp.router(
      title: 'WA9TECH',
      debugShowCheckedModeBanner: false,
      locale: Locale(langue),
      supportedLocales: const [Locale('fr'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: construireTheme(arabe: langue == 'ar'),
      routerConfig: routeur,
    );
  }
}

/// Barre de navigation du bas (Accueil, Agenda, Autour de moi, Mes sorties). L'onglet Proposer
/// arrivera à l'étape suivante.
class _Coquille extends StatelessWidget {
  const _Coquille({required this.chemin, required this.child});
  final String chemin;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    const onglets = ['/', '/agenda', '/autour', '/sorties'];
    final index = onglets.lastIndexWhere((o) => o != '/' && chemin.startsWith(o)).clamp(0, onglets.length - 1);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(onglets[i]),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: t.accueil),
          NavigationDestination(icon: const Icon(Icons.calendar_month_outlined), selectedIcon: const Icon(Icons.calendar_month), label: t.agenda),
          NavigationDestination(icon: const Icon(Icons.map_outlined), selectedIcon: const Icon(Icons.map), label: t.autourDeMoi),
          NavigationDestination(icon: const Icon(Icons.favorite_border), selectedIcon: const Icon(Icons.favorite), label: t.mesSorties),
        ],
      ),
    );
  }
}
