import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart' show LaunchMode;

/// Adresse de retour après la connexion Google sur le téléphone : Android rouvre l'application
/// (voir l'intent-filter dans AndroidManifest.xml). Doit figurer dans les « Redirect URLs » de Supabase.
const retourConnexion = 'tn.wa9tech.wa9tech://login-callback';

/// Profil du compte connecté (table profil + structure éventuelle).
class ProfilCompte {
  const ProfilCompte({
    required this.email,
    this.nom,
    this.role = 'public',
    this.structure,
    this.structureValidee = false,
    this.confiance = false,
  });

  final String email;
  final String? nom;
  final String role;
  final String? structure;
  final bool structureValidee;
  final bool confiance;

  bool get staff => role == 'admin' || role == 'moderateur';
}

/// Session en cours (null si déconnecté). Se met à jour à la connexion et à la déconnexion.
final sessionProvider = StreamProvider<Session?>((ref) async* {
  final auth = Supabase.instance.client.auth;
  yield auth.currentSession;
  yield* auth.onAuthStateChange.map((e) => e.session);
});

/// Profil du compte connecté, rechargé à chaque changement de session.
final profilProvider = FutureProvider<ProfilCompte?>((ref) async {
  final session = ref.watch(sessionProvider).value;
  final user = session?.user;
  if (user == null) return null;

  final ligne = await Supabase.instance.client
      .from('profil')
      .select('nom, role, organisateur:organisateur_id(nom, statut_compte, confiance)')
      .eq('id', user.id)
      .maybeSingle();
  final orga = ligne?['organisateur'] as Map<String, dynamic>?;

  return ProfilCompte(
    email: user.email ?? '',
    nom: _nonVide(ligne?['nom'] as String?) ?? nomFourni(user),
    role: (ligne?['role'] as String?) ?? 'public',
    structure: orga?['nom'] as String?,
    structureValidee: orga?['statut_compte'] == 'valide',
    confiance: orga?['confiance'] == true,
  );
});

String? _nonVide(String? s) => (s == null || s.trim().isEmpty) ? null : s.trim();

/// Nom donné par Google (aussi pour un compte créé auparavant par e-mail).
String? nomFourni(User user) {
  final sources = <Map<String, dynamic>?>[
    user.userMetadata,
    ...?user.identities?.map((i) => i.identityData),
  ];
  for (final m in sources) {
    final n = _nonVide(m?['full_name'] as String?) ?? _nonVide(m?['name'] as String?);
    if (n != null) return n;
  }
  return null;
}

/// Ouvre la page de connexion Google dans le navigateur du téléphone ; Google renvoie ensuite
/// vers l'application, qui termine la connexion toute seule (sessionProvider se met à jour).
Future<bool> connecterAvecGoogle() => Supabase.instance.client.auth.signInWithOAuth(
      OAuthProvider.google,
      // Dans Chrome (tests sur PC), retour sur la page de l'application web en cours
      redirectTo: kIsWeb ? Uri.base.origin : retourConnexion,
      authScreenLaunchMode: kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
    );

Future<void> deconnecter() => Supabase.instance.client.auth.signOut();
