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

  static bool get estConfigure => supabaseUrl.isNotEmpty && supabaseCle.isNotEmpty;
}
