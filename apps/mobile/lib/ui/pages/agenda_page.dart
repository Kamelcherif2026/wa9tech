import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/dates.dart';
import '../../data/depot.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import '../widgets/carte_evenement.dart';
import '../widgets/communs.dart';
import '../widgets/motifs.dart';

/// Agenda : recherche, pastilles de période, gratuit, ville et discipline ; chargement par pages de 20.
class AgendaPage extends ConsumerStatefulWidget {
  const AgendaPage({super.key, this.q, this.periode});
  final String? q;
  final String? periode;

  @override
  ConsumerState<AgendaPage> createState() => _AgendaPageState();
}

class _AgendaPageState extends ConsumerState<AgendaPage> {
  static const _parPage = 20;
  late Criteres _criteres;
  late final TextEditingController _champ;
  final _defilement = ScrollController();
  final List<Carte> _cartes = [];
  bool _enCours = false, _fini = false, _erreur = false;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _criteres = Criteres(q: widget.q, periode: _lirePeriode(widget.periode));
    _champ = TextEditingController(text: widget.q ?? '');
    _defilement.addListener(() {
      if (_defilement.position.pixels > _defilement.position.maxScrollExtent - 600) _charger();
    });
    _charger(depuisDebut: true);
  }

  @override
  void didUpdateWidget(AgendaPage old) {
    super.didUpdateWidget(old);
    // Arrivée depuis l'accueil avec une autre recherche ou période
    if (old.q != widget.q || old.periode != widget.periode) {
      _champ.text = widget.q ?? '';
      _appliquer(Criteres(q: widget.q, periode: _lirePeriode(widget.periode)));
    }
  }

  @override
  void dispose() {
    _champ.dispose();
    _defilement.dispose();
    super.dispose();
  }

  static Periode _lirePeriode(String? p) => switch (p) {
        'aujourdhui' => Periode.aujourdhui,
        'demain' => Periode.demain,
        'weekend' => Periode.weekend,
        'semaine' => Periode.semaine,
        'mois' => Periode.mois,
        _ => Periode.aVenir,
      };

  void _appliquer(Criteres c) {
    setState(() => _criteres = c);
    _charger(depuisDebut: true);
  }

  Future<void> _charger({bool depuisDebut = false}) async {
    if (_enCours || (_fini && !depuisDebut)) return;
    final criteres = _criteres;
    setState(() {
      _enCours = true;
      _erreur = false;
      if (depuisDebut) {
        _cartes.clear();
        _fini = false;
      }
    });
    try {
      final r = await ref.read(depotProvider).rechercher(criteres, limite: _parPage, decalage: _cartes.length);
      if (!mounted || criteres != _criteres) return; // critères changés entre-temps
      setState(() {
        _cartes.addAll(r);
        _fini = r.length < _parPage;
        if (r.isNotEmpty) _total = r.first.total;
        if (depuisDebut && r.isEmpty) _total = 0;
      });
    } catch (_) {
      if (mounted) setState(() => _erreur = true);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    final refs = ref.watch(referentielsProvider).value;

    return RefreshIndicator(
      color: Couleurs.terracotta,
      onRefresh: () => _charger(depuisDebut: true),
      child: CustomScrollView(
        controller: _defilement,
        slivers: [
          SliverToBoxAdapter(
            child: FondZellige(
              couleur: Couleurs.bleu,
              motif: Colors.white,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.agenda, style: styleTitre(context, taille: 32, couleur: Colors.white)),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _champ,
                        textInputAction: TextInputAction.search,
                        decoration: InputDecoration(
                          hintText: t.quoi,
                          prefixIcon: const Icon(Icons.search),
                          suffixIcon: _champ.text.isEmpty
                              ? null
                              : IconButton(
                                  icon: const Icon(Icons.close),
                                  onPressed: () {
                                    _champ.clear();
                                    _appliquer(_criteres.copie(q: ''));
                                  },
                                ),
                        ),
                        onSubmitted: (q) => _appliquer(_criteres.copie(q: q)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Filtres
          SliverToBoxAdapter(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
              child: Row(
                children: [
                  for (final p in [Periode.aVenir, Periode.aujourdhui, Periode.demain, Periode.weekend, Periode.semaine])
                    Padding(
                      padding: const EdgeInsetsDirectional.only(end: 8),
                      child: ChoiceChip(
                        label: Text(t.periode(p.index)),
                        selected: _criteres.periode == p,
                        labelStyle: TextStyle(color: _criteres.periode == p ? Couleurs.sable : Couleurs.encre, fontWeight: FontWeight.w600),
                        showCheckmark: false,
                        onSelected: (_) => _appliquer(_criteres.copie(periode: p)),
                      ),
                    ),
                  FilterChip(
                    avatar: Icon(Icons.redeem, size: 18, color: _criteres.gratuit ? Couleurs.sable : Couleurs.encre),
                    label: Text(t.gratuit),
                    selected: _criteres.gratuit,
                    showCheckmark: false,
                    labelStyle: TextStyle(color: _criteres.gratuit ? Couleurs.sable : Couleurs.encre, fontWeight: FontWeight.w600),
                    onSelected: (v) => _appliquer(_criteres.copie(gratuit: v)),
                  ),
                ],
              ),
            ),
          ),
          if (refs != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                child: Row(
                  children: [
                    Expanded(child: _Selecteur<Ville>(
                      icone: Icons.place_outlined,
                      libelleVide: t.partout,
                      valeur: refs.villes.where((v) => v.slug == _criteres.ville).firstOrNullCompat,
                      options: refs.villes,
                      libelle: (v) => v.nom(l),
                      surChoix: (v) => _appliquer(_criteres.copie(ville: v?.slug, effacerVille: v == null)),
                    )),
                    const SizedBox(width: 8),
                    Expanded(child: _Selecteur<Categorie>(
                      icone: Icons.category_outlined,
                      libelleVide: t.disciplines,
                      valeur: refs.disciplines.where((c) => c.id == _criteres.categorieId).firstOrNullCompat,
                      options: refs.disciplines,
                      libelle: (c) => c.libelle(l),
                      surChoix: (c) => _appliquer(_criteres.copie(categorieId: c?.id, effacerCategorie: c == null)),
                    )),
                  ],
                ),
              ),
            ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(children: [
                const Etoile(taille: 12),
                const SizedBox(width: 8),
                Text(_enCours && _cartes.isEmpty ? '…' : t.nbEvenements(_total),
                    style: const TextStyle(fontWeight: FontWeight.w700, color: Couleurs.discret)),
              ]),
            ),
          ),

          if (_cartes.isEmpty && _enCours)
            const SliverToBoxAdapter(child: Chargement())
          else if (_cartes.isEmpty && _erreur)
            SliverToBoxAdapter(child: ErreurChargement(surReessayer: () => _charger(depuisDebut: true)))
          else if (_cartes.isEmpty)
            const SliverToBoxAdapter(child: EtatVide())
          else ...[
            GrilleEvenements(cartes: _cartes),
            if (_enCours) const SliverToBoxAdapter(child: Chargement()),
            if (_erreur) SliverToBoxAdapter(child: ErreurChargement(surReessayer: _charger)),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}

extension _PremierOuRien<E> on Iterable<E> {
  E? get firstOrNullCompat {
    final it = iterator;
    return it.moveNext() ? it.current : null;
  }
}

/// Bouton qui ouvre une liste de choix en bas de l'écran (ville ou discipline).
class _Selecteur<V> extends StatelessWidget {
  const _Selecteur({
    required this.icone,
    required this.libelleVide,
    required this.valeur,
    required this.options,
    required this.libelle,
    required this.surChoix,
  });
  final IconData icone;
  final String libelleVide;
  final V? valeur;
  final List<V> options;
  final String Function(V) libelle;
  final void Function(V?) surChoix;

  @override
  Widget build(BuildContext context) {
    final actif = valeur != null;
    return OutlinedButton.icon(
      style: OutlinedButton.styleFrom(
        foregroundColor: actif ? Couleurs.sable : Couleurs.encre,
        backgroundColor: actif ? Couleurs.encre : Colors.white,
        side: const BorderSide(color: Couleurs.bordure, width: 1.5),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      icon: Icon(icone, size: 18),
      label: Text(actif ? libelle(valeur as V) : libelleVide, maxLines: 1, overflow: TextOverflow.ellipsis),
      onPressed: () => showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        builder: (context) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          builder: (context, defilement) => ListView(
            controller: defilement,
            children: [
              ListTile(
                title: Text(libelleVide, style: const TextStyle(fontWeight: FontWeight.w700)),
                trailing: actif ? null : const Icon(Icons.check, color: Couleurs.terracotta),
                onTap: () {
                  Navigator.pop(context);
                  surChoix(null);
                },
              ),
              for (final o in options)
                ListTile(
                  title: Text(libelle(o)),
                  trailing: o == valeur ? const Icon(Icons.check, color: Couleurs.terracotta) : null,
                  onTap: () {
                    Navigator.pop(context);
                    surChoix(o);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
