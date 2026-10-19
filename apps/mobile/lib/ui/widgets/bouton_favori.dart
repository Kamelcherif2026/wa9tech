import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/favoris.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../theme.dart';

/// Cœur « Mes sorties ». [pastille] : rond blanc posé sur une affiche (cartes) ;
/// sinon simple icône de la couleur [couleur] (en-tête de la fiche).
class BoutonFavori extends ConsumerWidget {
  const BoutonFavori({super.key, required this.carte, this.pastille = false, this.couleur = Couleurs.encre});
  final Carte carte;
  final bool pastille;
  final Color couleur;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final actif = ref.watch(favorisProvider.select((m) => m.containsKey(carte.id)));

    Future<void> basculer() async {
      await ref.read(favorisProvider.notifier).basculer(carte);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(actif ? t.retire : t.ajoute), duration: const Duration(seconds: 2)));
    }

    final icone = Icon(
      actif ? Icons.favorite : Icons.favorite_border,
      color: actif ? Couleurs.terracotta : (pastille ? Couleurs.encre : couleur),
      size: pastille ? 20 : 24,
    );

    if (!pastille) {
      return IconButton(icon: icone, tooltip: actif ? t.retirerSorties : t.ajouterSorties, onPressed: basculer);
    }
    return Semantics(
      button: true,
      label: actif ? t.retirerSorties : t.ajouterSorties,
      child: Material(
        color: Colors.white.withValues(alpha: 0.92),
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: basculer,
          child: Padding(padding: const EdgeInsets.all(7), child: icone),
        ),
      ),
    );
  }
}
