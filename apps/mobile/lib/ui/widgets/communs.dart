import 'package:flutter/material.dart';

import '../../i18n.dart';
import '../../theme.dart';
import 'motifs.dart';

/// Titre de section avec l'étoile safran et un lien « Voir tout » facultatif.
class TitreSection extends StatelessWidget {
  const TitreSection(this.titre, {super.key, this.surVoirTout});
  final String titre;
  final VoidCallback? surVoirTout;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 28, 8, 12),
        child: Row(
          children: [
            const Etoile(),
            const SizedBox(width: 10),
            Expanded(child: Text(titre, style: styleTitre(context, taille: 22))),
            if (surVoirTout != null)
              TextButton(
                onPressed: surVoirTout,
                style: TextButton.styleFrom(foregroundColor: Couleurs.terracotta),
                child: Text(T.of(context).voirTout),
              ),
          ],
        ),
      );
}

class Chargement extends StatelessWidget {
  const Chargement({super.key});
  @override
  Widget build(BuildContext context) =>
      const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: Couleurs.terracotta)));
}

/// Erreur réseau avec bouton « Réessayer ».
class ErreurChargement extends StatelessWidget {
  const ErreurChargement({super.key, required this.surReessayer});
  final VoidCallback surReessayer;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: Couleurs.discret),
            const SizedBox(height: 12),
            Text(t.erreurReseau, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: surReessayer, child: Text(t.reessayer)),
          ],
        ),
      ),
    );
  }
}

class EtatVide extends StatelessWidget {
  const EtatVide({super.key});
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
              Text('؟', style: styleTitre(context, taille: 44, couleur: Couleurs.safran)),
              const SizedBox(height: 8),
              Text(T.of(context).aucunResultat, textAlign: TextAlign.center, style: const TextStyle(color: Couleurs.discret)),
            ],
          ),
        ),
      );
}

/// Bandeau coloré en tête des pages ville, catégorie, lieu, artiste.
class Bandeau extends StatelessWidget {
  const Bandeau({super.key, required this.fond, required this.texte, this.surtitre, required this.titre, this.secondaire, this.icone, this.enfant});
  final Color fond, texte;
  final String? surtitre;
  final String titre;
  final String? secondaire;
  final IconData? icone;
  final Widget? enfant;

  @override
  Widget build(BuildContext context) {
    return FondZellige(
      couleur: fond,
      motif: texte,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: BackButton(color: texte, onPressed: () => Navigator.of(context).maybePop()),
                    ),
                    if (surtitre != null)
                      Text(surtitre!.toUpperCase(),
                          style: TextStyle(color: texte.withValues(alpha: 0.85), fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 2)),
                    const SizedBox(height: 6),
                    Text(titre, style: styleTitre(context, taille: 32, couleur: texte)),
                    if (secondaire != null) ...[
                      const SizedBox(height: 4),
                      Text(secondaire!, style: TextStyle(color: texte.withValues(alpha: 0.75), fontSize: 20, fontWeight: FontWeight.w700)),
                    ],
                    if (enfant != null) ...[const SizedBox(height: 14), enfant!],
                  ],
                ),
              ),
              if (icone != null) Icon(icone, size: 72, color: texte.withValues(alpha: 0.85)),
            ],
          ),
        ),
      ),
    );
  }
}
