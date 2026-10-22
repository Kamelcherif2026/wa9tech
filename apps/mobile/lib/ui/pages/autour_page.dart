import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../config.dart';
import '../../data/dates.dart';
import '../../data/modeles.dart';
import '../../i18n.dart';
import '../../providers.dart';
import '../../theme.dart';
import '../widgets/image_reseau.dart';
import 'fiche_page.dart' show ouvrir;

/// Centre par défaut quand la position du téléphone n'est pas disponible : Tunis.
const _tunis = LatLng(36.8065, 10.1815);

/// Toute la Tunisie (pour le bouton « Toute la Tunisie »).
final _tunisie = LatLngBounds(const LatLng(30.2, 7.5), const LatLng(37.55, 11.6));

/// « Autour de moi » : tous les événements de la période sont chargés en une fois et posés sur la carte ;
/// en déplaçant la carte on voit ceux de n'importe quelle région. La bande du bas liste ceux de la zone
/// visible, du plus proche au plus lointain (depuis votre position, sinon depuis le centre de la carte).
class AutourPage extends ConsumerStatefulWidget {
  const AutourPage({super.key});

  @override
  ConsumerState<AutourPage> createState() => _AutourPageState();
}

class _AutourPageState extends ConsumerState<AutourPage> {
  final _carte = MapController();
  bool _cartePrete = false;
  LatLng? _position; // position du téléphone, si connue
  Periode _periode = Periode.semaine;
  List<Proche> _tous = []; // toute la Tunisie, pour la période
  List<Proche> _visibles = []; // ceux de la zone affichée, triés par distance
  bool _chargement = false, _erreur = false;
  int _jeton = 0; // ignore les réponses d'un chargement dépassé
  Timer? _attenteDeplacement;

  @override
  void initState() {
    super.initState();
    _localiser(automatique: true);
  }

  @override
  void dispose() {
    _attenteDeplacement?.cancel();
    _carte.dispose();
    super.dispose();
  }

  /// Position du téléphone (demande l'autorisation la première fois). null si refusée ou indisponible.
  Future<LatLng?> _obtenirPosition() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return null;
      var autorisation = await Geolocator.checkPermission();
      if (autorisation == LocationPermission.denied) autorisation = await Geolocator.requestPermission();
      if (autorisation == LocationPermission.denied || autorisation == LocationPermission.deniedForever) return null;
      final p = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 15)),
      );
      return LatLng(p.latitude, p.longitude);
    } catch (_) {
      return null;
    }
  }

  Future<void> _localiser({bool automatique = false}) async {
    final p = await _obtenirPosition();
    if (!mounted) return;
    if (p == null) {
      if (!automatique) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text(T.of(context).positionIndisponible)));
      }
      return;
    }
    setState(() => _position = p);
    if (_cartePrete) {
      _carte.move(p, 12);
      _majVisibles();
    }
  }

  void _surCartePrete() {
    _cartePrete = true;
    if (_position != null) _carte.move(_position!, 12);
    unawaited(_charger());
  }

  /// Charge tous les événements de la période, partout en Tunisie.
  Future<void> _charger() async {
    final jeton = ++_jeton;
    setState(() {
      _chargement = true;
      _erreur = false;
    });
    try {
      final r = await ref.read(depotProvider).proches(lat: 34.0, lng: 9.5, rayonKm: 1000, periode: _periode, limite: 1000);
      if (!mounted || jeton != _jeton) return;
      _tous = r;
      _majVisibles();
    } catch (_) {
      if (mounted && jeton == _jeton) setState(() => _erreur = true);
    } finally {
      if (mounted && jeton == _jeton) setState(() => _chargement = false);
    }
  }

  /// Après un déplacement de la carte (attente courte pour ne pas recalculer à chaque image).
  void _surDeplacement() {
    _attenteDeplacement?.cancel();
    _attenteDeplacement = Timer(const Duration(milliseconds: 250), _majVisibles);
  }

  void _majVisibles() {
    if (!mounted || !_cartePrete) return;
    final camera = _carte.camera;
    final reference = _position ?? camera.center;
    const d = Distance();
    final liste = [
      for (final p in _tous)
        if (camera.visibleBounds.contains(LatLng(p.lat, p.lng)))
          p.avecDistance(d.as(LengthUnit.Meter, reference, LatLng(p.lat, p.lng)) / 1000),
    ]..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
    setState(() => _visibles = liste);
  }

  void _toutLePays() {
    _carte.fitCamera(CameraFit.bounds(bounds: _tunisie, padding: const EdgeInsets.fromLTRB(24, 140, 24, 200)));
    _majVisibles();
  }

  /// Un repère par lieu (plusieurs événements peuvent avoir lieu au même endroit).
  Map<String, List<Proche>> get _parLieu {
    final m = <String, List<Proche>>{};
    for (final p in _tous) {
      (m['${p.lat},${p.lng}'] ??= []).add(p);
    }
    return m;
  }

  void _ouvrirLieu(List<Proche> evenements) {
    // Distances recalculées depuis la position (ou le centre de la carte)
    final reference = _position ?? _carte.camera.center;
    evenements = [
      for (final p in evenements) p.avecDistance(const Distance().as(LengthUnit.Meter, reference, LatLng(p.lat, p.lng)) / 1000),
    ];
    final premier = evenements.first;
    _carte.move(LatLng(premier.lat, premier.lng), _carte.camera.zoom);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => _FeuilleLieu(evenements: evenements),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);

    return Stack(
      children: [
        Positioned.fill(
          child: FlutterMap(
          mapController: _carte,
          options: MapOptions(
            initialCenter: _tunis,
            initialZoom: 12,
            minZoom: 5,
            maxZoom: 18,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
            onMapReady: _surCartePrete,
            onPositionChanged: (camera, geste) => _surDeplacement(),
          ),
          children: [
            TileLayer(urlTemplate: Config.tuilesUrl, userAgentPackageName: 'tn.wa9tech.wa9tech'),
            MarkerLayer(
              markers: [
                for (final groupe in _parLieu.values)
                  Marker(
                    point: LatLng(groupe.first.lat, groupe.first.lng),
                    width: 46,
                    height: 52,
                    alignment: Alignment.topCenter,
                    child: _Epingle(nombre: groupe.length, surAppui: () => _ouvrirLieu(groupe)),
                  ),
                if (_position != null)
                  Marker(point: _position!, width: 22, height: 22, child: const _PointPosition()),
              ],
            ),
            RichAttributionWidget(
              attributions: [
                TextSourceAttribution('OpenStreetMap', onTap: () => ouvrir(Uri.parse('https://www.openstreetmap.org/copyright'))),
              ],
            ),
          ],
          ),
        ),

        // En-tête : titre et périodes
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
                  decoration: BoxDecoration(
                    color: Couleurs.sable,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 12, offset: Offset(0, 4))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.autourDeMoi, style: styleTitre(context, taille: 22)),
                      const SizedBox(height: 8),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            for (final p in [Periode.aujourdhui, Periode.weekend, Periode.semaine, Periode.mois])
                              Padding(
                                padding: const EdgeInsetsDirectional.only(end: 6),
                                child: ChoiceChip(
                                  label: Text(t.periode(p.index)),
                                  selected: _periode == p,
                                  showCheckmark: false,
                                  labelStyle: TextStyle(color: _periode == p ? Couleurs.sable : Couleurs.encre, fontWeight: FontWeight.w600),
                                  onSelected: (_) {
                                    setState(() => _periode = p);
                                    _charger();
                                  },
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                if (_chargement) const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator())),
              ],
            ),
          ),
          ),
        ),

        // Bas : bouton « ma position », nombre de résultats et bande des événements
        Positioned(
          left: 0,
          right: 0,
          bottom: 12,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      FloatingActionButton.small(
                        heroTag: 'tunisie',
                        tooltip: t.voirTunisie,
                        backgroundColor: Colors.white,
                        foregroundColor: Couleurs.bleu,
                        onPressed: _toutLePays,
                        child: const Icon(Icons.public),
                      ),
                      FloatingActionButton.small(
                        heroTag: 'ma-position',
                        tooltip: t.maPosition,
                        backgroundColor: Colors.white,
                        foregroundColor: Couleurs.bleu,
                        onPressed: _localiser,
                        child: const Icon(Icons.my_location),
                      ),
                    ],
                  ),
                ),
              ),
              if (!_chargement && _cartePrete) _Bande(resultats: _visibles, total: _tous.length, erreur: _erreur, surReessayer: _charger),
            ],
          ),
        ),
      ],
    );
  }
}

/// Repère d'un lieu sur la carte, avec le nombre d'événements.
class _Epingle extends StatelessWidget {
  const _Epingle({required this.nombre, required this.surAppui});
  final int nombre;
  final VoidCallback surAppui;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: surAppui,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.topCenter,
          children: [
            const Icon(Icons.location_on, size: 50, color: Couleurs.terracotta, shadows: [Shadow(color: Color(0x55000000), blurRadius: 6)]),
            Positioned(
              top: 9,
              child: Container(
                width: 22,
                height: 22,
                alignment: Alignment.center,
                decoration: const BoxDecoration(color: Couleurs.sable, shape: BoxShape.circle),
                child: Text('$nombre', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Couleurs.terracotta)),
              ),
            ),
          ],
        ),
      );
}

class _PointPosition extends StatelessWidget {
  const _PointPosition();

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Couleurs.bleu,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 6)],
        ),
      );
}

/// Bande du bas : nombre d'événements et cartes compactes, du plus proche au plus lointain.
class _Bande extends StatelessWidget {
  const _Bande({required this.resultats, required this.total, required this.erreur, required this.surReessayer});
  final List<Proche> resultats;
  final int total;
  final bool erreur;
  final VoidCallback surReessayer;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    Widget pastille(Widget enfant) => Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 10, offset: Offset(0, 3))],
            ),
            child: enfant,
          ),
        );

    if (erreur) {
      return pastille(Row(mainAxisSize: MainAxisSize.min, children: [
        Flexible(child: Text(t.erreurReseau)),
        TextButton(onPressed: surReessayer, child: Text(t.reessayer)),
      ]));
    }
    if (resultats.isEmpty) {
      return pastille(Text(
        total == 0 ? t.aucunAutour : '${t.aucunAutour}\n${t.nbTunisie(total)}',
        textAlign: TextAlign.center,
      ));
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        pastille(Text(t.nbZone(resultats.length), style: const TextStyle(fontWeight: FontWeight.w700))),
        const SizedBox(height: 8),
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: resultats.length,
            separatorBuilder: (context, i) => const SizedBox(width: 10),
            itemBuilder: (context, i) => SizedBox(width: 290, child: _CarteCompacte(p: resultats[i])),
          ),
        ),
      ],
    );
  }
}

/// Événement en une ligne : vignette, titre, date, lieu et distance.
class _CarteCompacte extends ConsumerWidget {
  const _CarteCompacte({required this.p});
  final Proche p;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    final date = p.carte.prochaineDate;
    return Material(
      color: Colors.white,
      elevation: 3,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/evenement/${p.carte.slug}'),
        child: Row(
          children: [
            SizedBox(
              width: 76,
              height: double.infinity,
              child: p.carte.image != null ? ImageReseau(p.carte.image!, largeurDecodage: 200) : const ColoredBox(color: Couleurs.accent),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(p.carte.titre(l), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    if (date != null)
                      Text('${dateLongue(date, l)} · ${heure(date)}',
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Couleurs.terracotta, fontWeight: FontWeight.w600)),
                    Text(
                      [p.nomLieu(l), t.distance(p.distanceKm)].whereType<String>().join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: Couleurs.discret),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Feuille ouverte en touchant un repère : les événements du lieu et le lien vers sa page.
class _FeuilleLieu extends ConsumerWidget {
  const _FeuilleLieu({required this.evenements});
  final List<Proche> evenements;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final l = ref.watch(langueProvider);
    final premier = evenements.first;
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.7),
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            Text(premier.nomLieu(l) ?? '', style: styleTitre(context, taille: 22)),
            Text(t.distance(premier.distanceKm), style: const TextStyle(color: Couleurs.discret)),
            const SizedBox(height: 12),
            for (final p in evenements) ...[
              SizedBox(height: 96, child: _CarteCompacte(p: p)),
              const SizedBox(height: 10),
            ],
            if (premier.lieuSlug != null)
              OutlinedButton.icon(
                icon: const Icon(Icons.place_outlined),
                label: Text(t.voirLieu),
                onPressed: () {
                  final routeur = GoRouter.of(context);
                  Navigator.pop(context);
                  routeur.push('/lieu/${premier.lieuSlug}');
                },
              ),
          ],
        ),
      ),
    );
  }
}
