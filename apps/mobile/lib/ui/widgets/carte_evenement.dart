import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/dates.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import 'image_reseau.dart';
import 'motifs.dart';

/// Carte « affiche » : l'affiche, l'étiquette billet safran (date), la catégorie, le titre, l'heure et le lieu.
class CarteEvenement extends ConsumerWidget {
  const CarteEvenement({super.key, required this.carte, this.largeur});
  final Carte carte;
  final double? largeur;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = ref.watch(langueProvider);
    final ref0 = ref.watch(referentielsProvider).value;
    final cat = ref0?.categorie(carte.categorieId);
    final ville = ref0?.ville(carte.villeId);
    final date = carte.prochaineDate;
    final m = date == null ? null : morceaux(date, l);
    final lieu = [carte.lieuNom, ville?.nom(l)].whereType<String>().join(' · ');

    return SizedBox(
      width: largeur,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/evenement/${carte.slug}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 4 / 5,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 14, offset: Offset(0, 6))],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: carte.image != null
                          ? ImageReseau(carte.image!, largeurDecodage: 500)
                          : FondZellige(
                              couleur: Couleurs.accent,
                              motif: Couleurs.terracotta,
                              child: Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Text(carte.titre(l), textAlign: TextAlign.center, style: styleTitre(context, taille: 16, couleur: Couleurs.terracotta)),
                                ),
                              ),
                            ),
                    ),
                  ),
                  if (carte.gratuit)
                    PositionedDirectional(
                      top: 8,
                      end: 8,
                      child: Transform.rotate(
                        angle: -0.05,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: Couleurs.succes, borderRadius: BorderRadius.circular(3)),
                          child: Text(T.of(context).gratuit.toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ),
                  if (m != null) PositionedDirectional(start: 10, bottom: -14, child: _Billet(m: m)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (cat != null)
              Text(cat.libelle(l).toUpperCase(),
                  style: const TextStyle(color: Couleurs.terracotta, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.6)),
            const SizedBox(height: 2),
            Text(carte.titre(l), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, height: 1.25)),
            const SizedBox(height: 4),
            if (date != null)
              _Ligne(icone: Icons.schedule, texte: heure(date)),
            if (lieu.isNotEmpty) _Ligne(icone: Icons.place_outlined, texte: lieu),
          ],
        ),
      ),
    );
  }
}

class _Billet extends StatelessWidget {
  const _Billet({required this.m});
  final ({String semaine, String jour, String mois}) m;

  @override
  Widget build(BuildContext context) => Container(
        constraints: const BoxConstraints(minWidth: 52),
        padding: const EdgeInsets.fromLTRB(8, 4, 8, 6),
        decoration: BoxDecoration(
          color: Couleurs.safran,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Couleurs.sable, width: 2),
          boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 2))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(m.semaine, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, height: 1)),
            Text(m.jour, style: styleTitre(context, taille: 22)),
            Text(m.mois, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, height: 1)),
          ],
        ),
      );
}

class _Ligne extends StatelessWidget {
  const _Ligne({required this.icone, required this.texte});
  final IconData icone;
  final String texte;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Row(
          children: [
            Icon(icone, size: 14, color: Couleurs.discret),
            const SizedBox(width: 4),
            Expanded(child: Text(texte, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: Couleurs.discret))),
          ],
        ),
      );
}

/// Grille de cartes (2 colonnes sur téléphone, plus sur tablette).
class GrilleEvenements extends StatelessWidget {
  const GrilleEvenements({super.key, required this.cartes});
  final List<Carte> cartes;

  @override
  Widget build(BuildContext context) {
    final colonnes = MediaQuery.sizeOf(context).width > 700 ? 3 : 2;
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: colonnes,
          crossAxisSpacing: 14,
          mainAxisSpacing: 22,
          childAspectRatio: 0.52,
        ),
        delegate: SliverChildBuilderDelegate((_, i) => CarteEvenement(carte: cartes[i]), childCount: cartes.length),
      ),
    );
  }
}

/// Rangée horizontale de cartes (sections de l'accueil).
class RangeeEvenements extends StatelessWidget {
  const RangeeEvenements({super.key, required this.cartes});
  final List<Carte> cartes;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 340,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: cartes.length,
          separatorBuilder: (context, index) => const SizedBox(width: 14),
          itemBuilder: (_, i) => CarteEvenement(carte: cartes[i], largeur: 170),
        ),
      );
}
