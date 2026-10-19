import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../config.dart';

/// « Proposer un événement » : envoi de l'affiche au site (POST /api/proposer), qui la fait lire par l'IA
/// puis la met en attente de validation dans le back-office. Mêmes règles que le formulaire du site.

/// Taille maximale acceptée par le serveur.
const tailleMaxAffiche = 3 * 1024 * 1024;

/// Erreurs possibles (mêmes clés que le site).
enum ErreurProposition { champs, image, trop, serveur }

class ResultatProposition {
  const ResultatProposition({this.ok = false, this.erreur, this.champs = const {}});
  final bool ok;
  final ErreurProposition? erreur;

  /// Champs à corriger : nom, contact, consentement, affiche.
  final Set<String> champs;
}

/// Type d'image reconnu d'après ses premiers octets (JPEG, PNG ou WebP), sinon null.
String? typeImage(Uint8List o) {
  if (o.length >= 3 && o[0] == 0xFF && o[1] == 0xD8 && o[2] == 0xFF) return 'image/jpeg';
  if (o.length >= 8 && o[0] == 0x89 && o[1] == 0x50 && o[2] == 0x4E && o[3] == 0x47) return 'image/png';
  if (o.length >= 12 &&
      ascii.decode(o.sublist(0, 4), allowInvalid: true) == 'RIFF' &&
      ascii.decode(o.sublist(8, 12), allowInvalid: true) == 'WEBP') {
    return 'image/webp';
  }
  return null;
}

final _telephone = RegExp(r'^\+?[\d\s.-]{8,16}$');
final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

/// Vérification avant l'envoi (le serveur refait les mêmes contrôles). Renvoie les champs à corriger.
Set<String> verifierProposition({required String nom, required String contact, required bool consentement, Uint8List? affiche}) {
  final c = contact.trim();
  return {
    if (nom.trim().length < 2 || nom.trim().length > 80) 'nom',
    if (c.length > 120 || !(_telephone.hasMatch(c) || _email.hasMatch(c))) 'contact',
    if (!consentement) 'consentement',
    if (affiche == null || affiche.isEmpty) 'affiche',
  };
}

Future<ResultatProposition> envoyerProposition({
  required Uint8List affiche,
  required String nom,
  required String contact,
  String? message,
  http.Client? client,
}) async {
  final type = typeImage(affiche);
  if (type == null || affiche.length > tailleMaxAffiche) {
    return const ResultatProposition(erreur: ErreurProposition.image, champs: {'affiche'});
  }
  final extension = switch (type) { 'image/png' => 'png', 'image/webp' => 'webp', _ => 'jpg' };
  final requete = http.MultipartRequest('POST', Uri.parse('${Config.siteUrl}/api/proposer'))
    ..fields['nom'] = nom.trim()
    ..fields['contact'] = contact.trim()
    ..fields['consentement'] = 'on'
    ..files.add(http.MultipartFile.fromBytes('affiche', affiche, filename: 'affiche.$extension', contentType: MediaType.parse(type)));
  if ((message ?? '').trim().isNotEmpty) requete.fields['message'] = message!.trim();

  final c = client ?? http.Client();
  try {
    final reponse = await http.Response.fromStream(await c.send(requete).timeout(const Duration(seconds: 60)));
    final Map<String, dynamic> j;
    try {
      j = jsonDecode(reponse.body) as Map<String, dynamic>;
    } catch (_) {
      return const ResultatProposition(erreur: ErreurProposition.serveur);
    }
    if (j['ok'] == true) return const ResultatProposition(ok: true);
    final erreur = ErreurProposition.values.where((e) => e.name == j['erreur']).firstOrNull ?? ErreurProposition.serveur;
    final champs = (j['champs'] as Map<String, dynamic>? ?? {}).keys.toSet();
    return ResultatProposition(erreur: erreur, champs: champs);
  } catch (_) {
    return const ResultatProposition(erreur: ErreurProposition.serveur); // réseau coupé, délai dépassé…
  } finally {
    if (client == null) c.close();
  }
}
