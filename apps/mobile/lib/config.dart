/// Réglages passés à la compilation avec --dart-define (jamais de clé secrète ici :
/// seule la clé publique « publishable » de Supabase est utilisée, la RLS protège les données).
///
/// Exemple :
///   flutter run --dart-define-from-file=env/staging.json
class Config {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseCle = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

  /// Adresse du site, pour les liens de partage.
  static const siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://wa9tech-staging.up.railway.app',
  );

  /// Fond de carte (« Autour de moi »). Par défaut OpenStreetMap, suffisant pour les essais ;
  /// pour la production, un fournisseur avec clé (MapTiler, Stadia…) via --dart-define=TUILES_URL=...
  static const tuilesUrl = String.fromEnvironment(
    'TUILES_URL',
    defaultValue: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  );

  static bool get estConfigure => supabaseUrl.isNotEmpty && supabaseCle.isNotEmpty;
}
