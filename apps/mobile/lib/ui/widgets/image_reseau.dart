import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../theme.dart';
import 'motifs.dart';

/// Affiche d'un événement chargée depuis internet.
/// - Téléphone : mise en cache sur l'appareil (cached_network_image).
/// - Navigateur (tests dans Chrome) : Image.network, le cache du navigateur suffit,
///   avec repli sur une balise <img> si le serveur refuse le chargement direct.
/// [largeurDecodage] réduit la taille en mémoire des grandes affiches (en pixels).
class ImageReseau extends StatelessWidget {
  const ImageReseau(this.url, {super.key, this.fit = BoxFit.cover, this.largeurDecodage, this.remplir = true});
  /// true : occupe toute la place du cadre ; false : garde la taille naturelle (fiche).
  final bool remplir;
  final String url;
  final BoxFit fit;
  final int? largeurDecodage;

  static Widget _attente() => const ColoredBox(color: Couleurs.bordure);

  static Widget _echec() => const FondZellige(
        couleur: Couleurs.accent,
        motif: Couleurs.terracotta,
        child: Center(child: Icon(Icons.image_not_supported_outlined, color: Couleurs.terracotta)),
      );

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return Image.network(
        url,
        fit: fit,
        width: remplir ? double.infinity : null,
        height: remplir ? double.infinity : null,
        cacheWidth: largeurDecodage,
        webHtmlElementStrategy: WebHtmlElementStrategy.fallback,
        loadingBuilder: (context, enfant, progression) => progression == null ? enfant : _attente(),
        errorBuilder: (context, erreur, pile) => _echec(),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: fit,
      width: remplir ? double.infinity : null,
      height: remplir ? double.infinity : null,
      memCacheWidth: largeurDecodage,
      fadeInDuration: const Duration(milliseconds: 200),
      placeholder: (context, url) => _attente(),
      errorWidget: (context, url, erreur) => _echec(),
    );
  }
}
