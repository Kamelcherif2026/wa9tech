import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

import '../config.dart';

/// Nouvelle version publiée sur GitHub (en attendant le Play Store).
class NouvelleVersion {
  const NouvelleVersion({required this.version, required this.build, this.notes});
  final String version;
  final int build;
  final String? notes;
}

/// Numéro de build « simple » : Android ajoute 1000 × type de processeur aux APK séparées
/// (ex. 2105 pour arm64, build 105) ; on retire ce décalage pour comparer.
int buildSansProcesseur(int versionCode) => versionCode % 1000;

/// Vérifie s'il existe une version plus récente que celle installée. null sinon,
/// ou si la vérification est impossible (pas de réseau, navigateur…) : jamais bloquant.
Future<NouvelleVersion?> chercherMiseAJour({http.Client? client}) async {
  if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return null;
  final c = client ?? http.Client();
  try {
    final info = await PackageInfo.fromPlatform();
    final installe = buildSansProcesseur(int.tryParse(info.buildNumber) ?? 0);
    final r = await c.get(Uri.parse(Config.versionUrl)).timeout(const Duration(seconds: 10));
    if (r.statusCode != 200) return null;
    final j = jsonDecode(r.body) as Map<String, dynamic>;
    final derniere = (j['build'] as num?)?.toInt() ?? 0;
    if (derniere <= installe) return null;
    return NouvelleVersion(version: j['version'] as String? ?? '', build: derniere, notes: j['notes'] as String?);
  } catch (_) {
    return null;
  } finally {
    if (client == null) c.close();
  }
}
