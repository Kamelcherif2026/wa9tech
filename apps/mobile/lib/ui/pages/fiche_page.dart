import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config.dart';
import '../../data/dates.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import '../widgets/carte_evenement.dart';
import '../widgets/communs.dart';
import '../widgets/image_reseau.dart';
import '../widgets/motifs.dart';

Future<void> ouvrir(Uri uri) =>
    launchUrl(uri, mode: LaunchMode.externalApplication);

class FichePage extends ConsumerStatefulWidget {
  const FichePage({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<FichePage> createState() => _FichePageState();
}

class _FichePageState extends ConsumerState<FichePage> {
  bool _vueComptee = false;

  @override
  Widget build(BuildContext context) {
    final fiche = ref.watch(ficheProvider(widget.slug));
    return Scaffold(
      body: fiche.when(
        loading: () => const Chargement(),
        error: (e, pile) => ErreurChargement(
          surReessayer: () => ref.invalidate(ficheProvider(widget.slug)),
        ),
        data: (f) {
          if (f == null) return const Center(child: Text('404'));
          if (!_vueComptee) {
            _vueComptee = true;
            ref.read(depotProvider).compterVue(f.id);
          }
          return _Contenu(f: f);
        },
      ),
    );
  }
}

class _Contenu extends ConsumerWidget {
  const _Contenu({required this.f});
  final Fiche f;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    final refs = ref.watch(referentielsProvider).value;
    final (fond, texte) = teintes[refs?.indexTeinte(f.categorieId) ?? 0];
    final cat = refs?.categorie(f.categorieId);
    final ville = refs?.ville(f.villeId)?.nom(l);
    final nomLieu = f.nomLieu(l);
    final villeAffichee =
        ville != null &&
            !(nomLieu ?? '').toLowerCase().contains(ville.toLowerCase())
        ? ville
        : null;
    final similaires = ref.watch(similairesProvider(f.id)).value ?? [];
    final url = '${Config.siteUrl}/$l/evenement/${f.slug}';

    return CustomScrollView(
      slivers: [
        // En-tête coloré selon la discipline, avec l'affiche entière
        SliverToBoxAdapter(
          child: FondZellige(
            couleur: fond,
            motif: texte,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        BackButton(color: texte),
                        const Spacer(),
                        IconButton(
                          icon: Icon(Icons.share_outlined, color: texte),
                          tooltip: t.partager,
                          onPressed: () => SharePlus.instance.share(
                            ShareParams(text: '${f.titre(l)}\n$url'),
                          ),
                        ),
                      ],
                    ),
                    if (f.images.isNotEmpty)
                      Center(
                        child: Transform.rotate(
                          angle: -0.025,
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 300),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: Couleurs.sable,
                                width: 6,
                              ),
                              borderRadius: BorderRadius.circular(6),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x66000000),
                                  blurRadius: 24,
                                  offset: Offset(0, 10),
                                ),
                              ],
                            ),
                            child: ImageReseau(
                              f.images.first,
                              fit: BoxFit.contain,
                              remplir: false,
                              largeurDecodage: 900,
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 22),
                    if (cat != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Couleurs.sable,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          cat.libelle(l).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                            color: Couleurs.encre,
                          ),
                        ),
                      ),
                    const SizedBox(height: 10),
                    Text(
                      f.titre(l),
                      style: styleTitre(context, taille: 30, couleur: texte),
                    ),
                    if (l == 'fr' && (f.titreAr ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          f.titreAr!,
                          textDirection: TextDirection.rtl,
                          style: TextStyle(
                            color: texte.withValues(alpha: 0.8),
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    if (f.artistes.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            t.avec,
                            style: TextStyle(
                              color: texte,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          for (final (i, a) in f.artistes.indexed)
                            ActionChip(
                              label: Text(a.nomAffiche(l)),
                              labelStyle: TextStyle(
                                color: i == 0 ? Couleurs.encre : texte,
                                fontWeight: FontWeight.w700,
                              ),
                              color: WidgetStatePropertyAll(
                                i == 0 ? Couleurs.sable : Colors.transparent,
                              ),
                              side: BorderSide(
                                color: i == 0 ? Couleurs.sable : texte,
                                width: 1.5,
                              ),
                              onPressed: () =>
                                  context.push('/artiste/${a.slug}'),
                            ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 14),
                    if (f.prochaineDate != null)
                      _Info(
                        icone: Icons.calendar_today,
                        texte:
                            '${dateLongue(f.prochaineDate!, l)} · ${heure(f.prochaineDate!)}',
                        couleur: texte,
                      ),
                    if (nomLieu != null)
                      _Info(
                        icone: Icons.place_outlined,
                        texte: [
                          nomLieu,
                          villeAffichee,
                        ].whereType<String>().join(' · '),
                        couleur: texte,
                      ),
                    _Info(
                      icone: Icons.confirmation_number_outlined,
                      texte: _prix(f, t, l),
                      couleur: texte,
                      gras: true,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

        // Dates en billets
        SliverToBoxAdapter(child: TitreSection(t.dates)),
        SliverList.separated(
          itemCount: f.representations.length,
          separatorBuilder: (context, i) => const SizedBox(height: 8),
          itemBuilder: (context, i) {
            final r = f.representations[i];
            final m = morceaux(r.debut, l);
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Couleurs.bordure),
                ),
                clipBehavior: Clip.antiAlias,
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        width: 72,
                        color: Couleurs.safran,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              m.semaine,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              m.jour,
                              style: styleTitre(context, taille: 26),
                            ),
                            Text(
                              m.mois,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                dateLongue(r.debut, l),
                                style: const TextStyle(
                                  color: Couleurs.discret,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                heure(r.debut),
                                style: styleTitre(
                                  context,
                                  taille: 24,
                                  couleur: Couleurs.terracotta,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),

        // Réservation
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: FondZellige(
                couleur: Couleurs.terracotta,
                motif: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        t.votreSortie.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _prix(f, t, l),
                        style: styleTitre(
                          context,
                          taille: 26,
                          couleur: Colors.white,
                        ),
                      ),
                      if ((f.infosReservation ?? '').isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          f.infosReservation!,
                          style: const TextStyle(color: Colors.white),
                        ),
                      ],
                      if ((f.telephone ?? '').isNotEmpty) ...[
                        const SizedBox(height: 14),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: Couleurs.sable,
                            foregroundColor: Couleurs.encre,
                            minimumSize: const Size.fromHeight(48),
                          ),
                          icon: const Icon(Icons.call),
                          label: Text('${t.appeler}  ${f.telephone}'),
                          onPressed: () {
                            ref
                                .read(depotProvider)
                                .compterClicReservation(f.id);
                            final n = f.telephone!
                                .replaceAll(RegExp(r'\D'), '')
                                .replaceFirst(RegExp(r'^216'), '');
                            ouvrir(Uri.parse('tel:+216$n'));
                          },
                        ),
                      ],
                      if ((f.lienExterne ?? '').isNotEmpty) ...[
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(
                              color: Colors.white70,
                              width: 2,
                            ),
                            minimumSize: const Size.fromHeight(48),
                          ),
                          icon: const Icon(Icons.open_in_new),
                          label: Text(t.plusInfos),
                          onPressed: () {
                            ref
                                .read(depotProvider)
                                .compterClicReservation(f.id);
                            ouvrir(Uri.parse(f.lienExterne!));
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),

        // Description
        if ((f.description(l) ?? '').isNotEmpty || f.organisateur != null)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Couleurs.bordure),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if ((f.description(l) ?? '').isNotEmpty)
                      Text(
                        f.description(l)!,
                        style: const TextStyle(fontSize: 16, height: 1.5),
                      ),
                    if (f.organisateur != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        '${t.organisePar} : ${f.organisateur}',
                        style: const TextStyle(
                          color: Couleurs.discret,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),

        // Lieu
        if (nomLieu != null) ...[
          SliverToBoxAdapter(child: TitreSection(t.lieu)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Couleurs.bordure),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  leading: const Icon(Icons.place, color: Couleurs.terracotta),
                  title: Text(
                    nomLieu,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    [f.lieuAdresse, ville].whereType<String>().join(' · '),
                  ),
                  onTap: f.lieuSlug == null
                      ? null
                      : () => context.push('/lieu/${f.lieuSlug}'),
                  trailing: f.lat == null
                      ? null
                      : IconButton.filledTonal(
                          tooltip: t.itineraire,
                          icon: const Icon(Icons.directions),
                          onPressed: () => ouvrir(
                            Uri.parse(
                              'https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}',
                            ),
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],

        if (similaires.isNotEmpty) ...[
          SliverToBoxAdapter(child: TitreSection(t.similaires)),
          SliverToBoxAdapter(child: RangeeEvenements(cartes: similaires)),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 40)),
      ],
    );
  }

  static String _prix(Fiche f, T t, String l) {
    if (f.gratuit) return t.gratuit;
    if (f.prixMin == null) return t.prixNonCommunique;
    String nb(double v) =>
        v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toStringAsFixed(1);
    if (f.prixMax != null && f.prixMax != f.prixMin)
      return '${nb(f.prixMin!)} – ${nb(f.prixMax!)} ${t.dt}';
    return '${nb(f.prixMin!)} ${t.dt}';
  }
}

class _Info extends StatelessWidget {
  const _Info({
    required this.icone,
    required this.texte,
    required this.couleur,
    this.gras = false,
  });
  final IconData icone;
  final String texte;
  final Color couleur;
  final bool gras;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 6),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icone, size: 18, color: couleur),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            texte,
            style: TextStyle(
              color: couleur,
              fontSize: 15,
              fontWeight: gras ? FontWeight.w700 : FontWeight.w400,
            ),
          ),
        ),
      ],
    ),
  );
}
