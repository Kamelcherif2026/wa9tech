import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/depot.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import '../widgets/carte_evenement.dart';
import '../widgets/communs.dart';
import '../widgets/icones.dart';
import 'fiche_page.dart' show ouvrir;

/// Squelette commun : bandeau + grille d'événements.
class _PageListe extends StatelessWidget {
  const _PageListe({required this.bandeau, required this.cartes, this.titreListe, required this.surReessayer});
  final Widget bandeau;
  final AsyncValue<List<Carte>> cartes;
  final String? titreListe;
  final VoidCallback surReessayer;

  @override
  Widget build(BuildContext context) => Scaffold(
        body: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: bandeau),
            if (titreListe != null) SliverToBoxAdapter(child: TitreSection(titreListe!)) else const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ...cartes.when<List<Widget>>(
              loading: () => [const SliverToBoxAdapter(child: Chargement())],
              error: (e, pile) => [SliverToBoxAdapter(child: ErreurChargement(surReessayer: surReessayer))],
              data: (c) => c.isEmpty ? [const SliverToBoxAdapter(child: EtatVide())] : [GrilleEvenements(cartes: c)],
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      );
}

class PageVille extends ConsumerWidget {
  const PageVille({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = ref.watch(langueProvider);
    final ville = ref.watch(referentielsProvider).value?.villes.where((v) => v.slug == slug).toList();
    final v = (ville == null || ville.isEmpty) ? null : ville.first;
    final criteres = Criteres(ville: slug);
    return _PageListe(
      bandeau: Bandeau(
        fond: Couleurs.bleu,
        texte: Colors.white,
        surtitre: T.of(context).agenda,
        titre: v?.nom(l) ?? slug,
        secondaire: v == null ? null : (l == 'ar' ? v.nomFr : v.nomAr),
        icone: Icons.location_city_rounded,
      ),
      cartes: ref.watch(listeProvider(criteres)),
      surReessayer: () => ref.invalidate(listeProvider(criteres)),
    );
  }
}

class PageCategorie extends ConsumerWidget {
  const PageCategorie({super.key, required this.id});
  final int id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = ref.watch(langueProvider);
    final refs = ref.watch(referentielsProvider).value;
    final c = refs?.categorie(id);
    final parent = refs?.discipline(id);
    final (fond, texte) = teintes[refs?.indexTeinte(id) ?? 0];
    final sous = refs?.categories.where((x) => x.parentId == parent?.id).toList() ?? [];
    final criteres = Criteres(categorieId: id);

    return _PageListe(
      bandeau: Bandeau(
        fond: fond,
        texte: texte,
        surtitre: c?.parentId != null ? parent?.libelle(l) : T.of(context).disciplines,
        titre: c?.libelle(l) ?? '',
        secondaire: c == null ? null : (l == 'ar' ? c.libelleFr : c.libelleAr),
        icone: iconeDiscipline(parent?.slug),
        enfant: sous.isEmpty
            ? null
            : Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _Pastille(texte: T.of(context).toutes, actif: c?.id == parent?.id, couleur: texte, surAppui: () => context.pushReplacement('/categorie/${parent!.id}')),
                  for (final s in sous)
                    _Pastille(texte: s.libelle(l), actif: s.id == id, couleur: texte, surAppui: () => context.pushReplacement('/categorie/${s.id}')),
                ],
              ),
      ),
      cartes: ref.watch(listeProvider(criteres)),
      surReessayer: () => ref.invalidate(listeProvider(criteres)),
    );
  }
}

class _Pastille extends StatelessWidget {
  const _Pastille({required this.texte, required this.actif, required this.couleur, required this.surAppui});
  final String texte;
  final bool actif;
  final Color couleur;
  final VoidCallback surAppui;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: surAppui,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: actif ? Couleurs.sable : Colors.transparent,
            border: Border.all(color: actif ? Couleurs.sable : couleur, width: 1.5),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(texte, style: TextStyle(color: actif ? Couleurs.encre : couleur, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      );
}

class PageLieu extends ConsumerWidget {
  const PageLieu({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    final r = ref.watch(lieuProvider(slug));
    final lieu = r.value?.lieu;
    final ville = ref.watch(referentielsProvider).value?.ville(lieu?.villeId)?.nom(l);

    return _PageListe(
      bandeau: Bandeau(
        fond: Couleurs.encre,
        texte: Couleurs.sable,
        surtitre: t.lieu,
        titre: lieu?.nomAffiche(l) ?? '',
        secondaire: l == 'fr' ? lieu?.nomAr : null,
        icone: Icons.place_rounded,
        enfant: lieu == null
            ? null
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if ((lieu.adresse ?? '').isNotEmpty || ville != null)
                    Text([lieu.adresse, ville].whereType<String>().join(' · '), style: const TextStyle(color: Couleurs.sable)),
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    if ((lieu.telephone ?? '').isNotEmpty)
                      _BoutonBandeau(icone: Icons.call, texte: lieu.telephone!, surAppui: () => ouvrir(Uri.parse('tel:${lieu.telephone!.replaceAll(' ', '')}'))),
                    if ((lieu.lien ?? '').isNotEmpty)
                      _BoutonBandeau(icone: Icons.open_in_new, texte: t.plusInfos, surAppui: () => ouvrir(Uri.parse(lieu.lien!))),
                    if (lieu.lat != null)
                      _BoutonBandeau(
                        icone: Icons.directions,
                        texte: t.itineraire,
                        surAppui: () => ouvrir(Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}')),
                      ),
                  ]),
                ],
              ),
      ),
      titreListe: t.aVenirIci,
      cartes: r.whenData((x) => x?.cartes ?? <Carte>[]),
      surReessayer: () => ref.invalidate(lieuProvider(slug)),
    );
  }
}

class PageArtiste extends ConsumerWidget {
  const PageArtiste({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    final refs = ref.watch(referentielsProvider).value;
    final r = ref.watch(artisteProvider(slug));
    final a = r.value?.artiste;
    final cartes = r.value?.cartes ?? [];

    // Discipline principale : la plus fréquente dans ses événements, sinon celle de sa fiche
    final compte = <int, int>{};
    for (final c in cartes) {
      final d = refs?.discipline(c.categorieId);
      if (d != null) compte[d.id] = (compte[d.id] ?? 0) + 1;
    }
    final triees = compte.entries.toList()..sort((x, y) => y.value.compareTo(x.value));
    final disciplineId = triees.isNotEmpty ? triees.first.key : a?.disciplineId;
    final discipline = refs?.categorie(disciplineId);
    final (fond, texte) = discipline == null ? (Couleurs.safran, Couleurs.encre) : teintes[refs!.indexTeinte(discipline.id)];

    return _PageListe(
      bandeau: Bandeau(
        fond: fond,
        texte: texte,
        surtitre: discipline == null ? t.artiste : '${t.artiste} · ${discipline.libelle(l)}',
        titre: a?.nomAffiche(l) ?? '',
        secondaire: a == null ? null : (l == 'ar' ? (a.nomAr != null && a.nomAr != a.nom ? a.nom : null) : (a.nomAr != a.nom ? a.nomAr : null)),
        icone: discipline == null ? Icons.person_rounded : iconeDiscipline(discipline.slug),
        enfant: (a?.lien ?? '').isEmpty ? null : _BoutonBandeau(icone: Icons.open_in_new, texte: t.plusInfos, surAppui: () => ouvrir(Uri.parse(a!.lien!)), couleur: texte),
      ),
      titreListe: t.prochainesDates,
      cartes: r.whenData((x) => x?.cartes ?? <Carte>[]),
      surReessayer: () => ref.invalidate(artisteProvider(slug)),
    );
  }
}

class _BoutonBandeau extends StatelessWidget {
  const _BoutonBandeau({required this.icone, required this.texte, required this.surAppui, this.couleur = Couleurs.sable});
  final IconData icone;
  final String texte;
  final VoidCallback surAppui;
  final Color couleur;

  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
        style: OutlinedButton.styleFrom(foregroundColor: couleur, side: BorderSide(color: couleur, width: 1.5), shape: const StadiumBorder()),
        icon: Icon(icone, size: 18),
        label: Text(texte),
        onPressed: surAppui,
      );
}
