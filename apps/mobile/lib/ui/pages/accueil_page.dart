import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/dates.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import '../widgets/carte_evenement.dart';
import '../widgets/communs.dart';
import '../widgets/image_reseau.dart';
import '../widgets/icones.dart';
import '../widgets/motifs.dart';

class AccueilPage extends ConsumerWidget {
  const AccueilPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final accueil = ref.watch(accueilProvider);
    final refs = ref.watch(referentielsProvider);

    return RefreshIndicator(
      color: Couleurs.terracotta,
      onRefresh: () async {
        ref.invalidate(accueilProvider);
        await ref.read(accueilProvider.future);
      },
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _Ouverture()),
          ...accueil.when<List<Widget>>(
            loading: () => [const SliverToBoxAdapter(child: Chargement())],
            error: (e, pile) => [SliverToBoxAdapter(child: ErreurChargement(surReessayer: () => ref.invalidate(accueilProvider)))],
            data: (s) => [
              if (s.aLaUne.isNotEmpty) SliverToBoxAdapter(child: _ALaUne(cartes: s.aLaUne)),
              if (s.aujourdhui.isNotEmpty) ...[
                SliverToBoxAdapter(child: TitreSection(t.ceSoir, surVoirTout: () => context.go('/agenda?quand=aujourdhui'))),
                SliverToBoxAdapter(child: RangeeEvenements(cartes: s.aujourdhui)),
              ],
              if (s.weekend.isNotEmpty) ...[
                SliverToBoxAdapter(child: TitreSection(t.ceWeekend, surVoirTout: () => context.go('/agenda?quand=weekend'))),
                SliverToBoxAdapter(child: RangeeEvenements(cartes: s.weekend)),
              ],
              SliverToBoxAdapter(child: TitreSection(t.bientot, surVoirTout: () => context.go('/agenda'))),
              if (s.bientot.isEmpty) const SliverToBoxAdapter(child: EtatVide()) else SliverToBoxAdapter(child: RangeeEvenements(cartes: s.bientot)),
            ],
          ),
          if (refs.value != null) ...[
            SliverToBoxAdapter(child: TitreSection(t.disciplines)),
            SliverToBoxAdapter(child: _Disciplines(refs: refs.value!)),
            SliverToBoxAdapter(child: TitreSection(t.villes)),
            SliverToBoxAdapter(child: _Villes(refs: refs.value!)),
          ],
          const SliverToBoxAdapter(child: _AppelProposer()),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}

/// Bas de l'accueil : invitation aux organisateurs à envoyer leur affiche.
class _AppelProposer extends StatelessWidget {
  const _AppelProposer();

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 28, 16, 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: FondZellige(
          couleur: Couleurs.encre,
          motif: Couleurs.safran,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.proposerAppel, style: styleTitre(context, taille: 22, couleur: Couleurs.safran)),
                const SizedBox(height: 6),
                Text(t.proposerIntro, style: const TextStyle(color: Couleurs.sable, height: 1.4)),
                const SizedBox(height: 14),
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: Couleurs.safran, foregroundColor: Couleurs.encre),
                  onPressed: () => context.push('/proposer'),
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  label: Text(t.proposer, style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// En-tête : accroche, slogan, champ de recherche, bouton de langue.
class _Ouverture extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Image.asset('assets/images/logo-wa9tech.png', height: 30, semanticLabel: 'WA9TECH'),
                  ),
                ),
                FilledButton.icon(
                  onPressed: () => context.push('/proposer'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Couleurs.terracotta,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(t.proposerCourt, style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () => ref.read(langueProvider.notifier).basculer(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Couleurs.encre,
                    side: const BorderSide(color: Couleurs.encre, width: 2),
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    visualDensity: VisualDensity.compact,
                  ),
                  child: Text(t.langue, style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(children: [
              const Etoile(taille: 14),
              const SizedBox(width: 8),
              Text(t.accroche.toUpperCase(),
                  style: const TextStyle(color: Couleurs.terracotta, fontWeight: FontWeight.w800, letterSpacing: 2, fontSize: 12)),
            ]),
            const SizedBox(height: 8),
            Text(t.slogan, style: styleTitre(context, taille: 34)),
            const SizedBox(height: 16),
            TextField(
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(hintText: t.quoi, prefixIcon: const Icon(Icons.search)),
              onSubmitted: (q) => context.go('/agenda?q=${Uri.encodeQueryComponent(q)}'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Bandeau terracotta « À la une » : affiches dans un arc de porte, à faire défiler.
class _ALaUne extends ConsumerStatefulWidget {
  const _ALaUne({required this.cartes});
  final List<Carte> cartes;
  @override
  ConsumerState<_ALaUne> createState() => _ALaUneState();
}

class _ALaUneState extends ConsumerState<_ALaUne> {
  int _page = 0;
  final _controleur = PageController(viewportFraction: 0.82);

  @override
  void dispose() {
    _controleur.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    return Padding(
      padding: const EdgeInsets.only(top: 28),
      child: FondZellige(
        couleur: Couleurs.terracotta,
        motif: Colors.white,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(children: [
                  const Etoile(),
                  const SizedBox(width: 10),
                  Text(t.aLaUne, style: styleTitre(context, taille: 22, couleur: Colors.white)),
                ]),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 420,
                child: PageView.builder(
                  controller: _controleur,
                  itemCount: widget.cartes.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (context, i) {
                    final c = widget.cartes[i];
                    return GestureDetector(
                      onTap: () => context.push('/evenement/${c.slug}'),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Column(
                          children: [
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Couleurs.sable,
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(400), bottom: Radius.circular(6)),
                                  border: Border.all(color: Couleurs.sable, width: 5),
                                  boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 18, offset: Offset(0, 8))],
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: c.image != null
                                    ? ImageReseau(c.image!, largeurDecodage: 700)
                                    : FondZellige(couleur: Couleurs.bleu, motif: Colors.white, child: const SizedBox.expand()),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(c.titre(l),
                                maxLines: 2,
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                                style: styleTitre(context, taille: 20, couleur: Colors.white)),
                            if (c.prochaineDate != null)
                              Text('${dateLongue(c.prochaineDate!, l)} · ${heure(c.prochaineDate!)}',
                                  style: const TextStyle(color: Colors.white, fontSize: 13)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < widget.cartes.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: i == _page ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: i == _page ? Couleurs.safran : Colors.white54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Disciplines extends ConsumerWidget {
  const _Disciplines({required this.refs});
  final Referentiels refs;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = ref.watch(langueProvider);
    final ds = refs.disciplines;
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 1.45),
      itemCount: ds.length,
      itemBuilder: (context, i) {
        final (fond, texte) = teintes[i % teintes.length];
        final d = ds[i];
        return InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => context.push('/categorie/${d.id}'),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: FondZellige(
              couleur: fond,
              motif: texte,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(iconeDiscipline(d.slug), color: texte, size: 30),
                    Text(d.libelle(l), style: styleTitre(context, taille: 17, couleur: texte)),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Villes extends ConsumerWidget {
  const _Villes({required this.refs});
  final Referentiels refs;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = ref.watch(langueProvider);
    // Villes principales d'abord
    const principales = ['tunis', 'la-marsa', 'sousse', 'sfax', 'hammamet', 'djerba', 'bizerte', 'monastir', 'kairouan', 'tozeur'];
    final villes = [...refs.villes]..sort((a, b) {
        final ia = principales.indexOf(a.slug), ib = principales.indexOf(b.slug);
        return (ia < 0 ? 99 : ia).compareTo(ib < 0 ? 99 : ib);
      });
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final v in villes)
            ActionChip(label: Text(v.nom(l)), onPressed: () => context.push('/ville/${v.slug}')),
        ],
      ),
    );
  }
}
