import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/favoris.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import '../widgets/carte_evenement.dart';
import '../widgets/communs.dart';
import '../widgets/motifs.dart';

/// Mes sorties : les événements mis de côté (cœur), enregistrés sur le téléphone.
class SortiesPage extends ConsumerStatefulWidget {
  const SortiesPage({super.key});

  @override
  ConsumerState<SortiesPage> createState() => _SortiesPageState();
}

class _SortiesPageState extends ConsumerState<SortiesPage> {
  @override
  void initState() {
    super.initState();
    // Mise à jour des dates et des titres en arrière-plan (sans bloquer l'affichage)
    Future.microtask(_rafraichir);
  }

  Future<void> _rafraichir() => ref.read(favorisProvider.notifier).synchroniser(ref.read(langueProvider));

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final favoris = ref.watch(favorisProvider).values.map((f) => f.carte).toList();
    final maintenant = DateTime.now();
    final aVenir = favoris.where((c) => c.prochaineDate != null && c.prochaineDate!.isAfter(maintenant)).toList()
      ..sort((a, b) => a.prochaineDate!.compareTo(b.prochaineDate!));
    final autres = favoris.where((c) => !aVenir.contains(c)).toList();

    return RefreshIndicator(
      color: Couleurs.terracotta,
      onRefresh: _rafraichir,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: FondZellige(
              couleur: Couleurs.terracotta,
              motif: Colors.white,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                  child: Row(
                    children: [
                      const Icon(Icons.favorite, color: Colors.white, size: 28),
                      const SizedBox(width: 10),
                      Expanded(child: Text(t.mesSorties, style: styleTitre(context, taille: 32, couleur: Colors.white))),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (favoris.isEmpty)
            SliverToBoxAdapter(child: _Vide(texte: t.sortiesVide))
          else ...[
            if (aVenir.isNotEmpty) ...[
              SliverToBoxAdapter(child: TitreSection(t.aVenirSorties)),
              GrilleEvenements(cartes: aVenir),
            ],
            if (autres.isNotEmpty) ...[
              SliverToBoxAdapter(child: TitreSection(t.passees)),
              SliverOpacity(opacity: 0.6, sliver: GrilleEvenements(cartes: autres)),
            ],
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}

class _Vide extends StatelessWidget {
  const _Vide({required this.texte});
  final String texte;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Couleurs.bordure, width: 2),
          ),
          child: Column(
            children: [
              const Icon(Icons.favorite_border, size: 44, color: Couleurs.terracotta),
              const SizedBox(height: 10),
              Text(texte, textAlign: TextAlign.center, style: const TextStyle(color: Couleurs.discret, fontSize: 15)),
            ],
          ),
        ),
      );
}

