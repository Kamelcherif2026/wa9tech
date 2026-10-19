/// Dates à l'heure de Tunis (UTC+1 toute l'année, pas d'heure d'été).
/// Même logique que le site (apps/web/src/lib/public/dates.ts).
library;

const _decalage = Duration(hours: 1);

/// Convertit un instant en « heure murale » de Tunis.
DateTime versTunis(DateTime instant) => instant.toUtc().add(_decalage);

/// Instant UTC correspondant à une date/heure de Tunis.
DateTime depuisTunis(int a, int m, int j, [int h = 0, int min = 0, int s = 0]) =>
    DateTime.utc(a, m, j, h, min, s).subtract(_decalage);

enum Periode { aVenir, aujourdhui, demain, weekend, semaine, mois }

/// Fenêtre [début, fin] d'une période (fin = null : sans limite).
({DateTime debut, DateTime? fin}) fenetre(Periode p, [DateTime? maintenant]) {
  final now = (maintenant ?? DateTime.now()).toUtc();
  final t = versTunis(now);
  DateTime jour(int decalageJours, int h, int min, int s) =>
      depuisTunis(t.year, t.month, t.day + decalageJours, h, min, s);
  final js = t.weekday % 7; // 0 = dimanche … 6 = samedi
  switch (p) {
    case Periode.aujourdhui:
      return (debut: now, fin: jour(0, 23, 59, 59));
    case Periode.demain:
      return (debut: jour(1, 0, 0, 0), fin: jour(1, 23, 59, 59));
    case Periode.weekend:
      // Du vendredi 17 h au dimanche soir (si on est déjà le week-end : jusqu'à dimanche)
      final versVendredi = (5 - js + 7) % 7;
      final dejaWeekend = js >= 5 || js == 0;
      final debut = dejaWeekend ? now : jour(versVendredi, 17, 0, 0);
      final versDimanche = js == 0 ? 0 : (7 - js) % 7;
      return (debut: debut, fin: jour(versDimanche, 23, 59, 59));
    case Periode.semaine:
      return (debut: now, fin: jour(7, 23, 59, 59));
    case Periode.mois:
      return (debut: now, fin: jour(31, 23, 59, 59));
    case Periode.aVenir:
      return (debut: now, fin: null);
  }
}

const _joursFr = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const _joursLongFr = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const _moisFr = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const _moisLongFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const _joursAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
// Noms des mois utilisés en Tunisie
const _moisAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

String _deux(int n) => n.toString().padLeft(2, '0');

/// « 20:30 »
String heure(DateTime instant) {
  final t = versTunis(instant);
  return '${_deux(t.hour)}:${_deux(t.minute)}';
}

/// Morceaux pour l'étiquette « billet » : jour de la semaine, numéro, mois.
({String semaine, String jour, String mois}) morceaux(DateTime instant, String langue) {
  final t = versTunis(instant);
  final ar = langue == 'ar';
  return (
    semaine: ar ? _joursAr[t.weekday - 1] : _joursFr[t.weekday - 1],
    jour: '${t.day}',
    mois: ar ? _moisAr[t.month - 1] : _moisFr[t.month - 1],
  );
}

/// « Vendredi 23 octobre 2026 » / « الجمعة 23 أكتوبر 2026 »
String dateLongue(DateTime instant, String langue) {
  final t = versTunis(instant);
  if (langue == 'ar') return '${_joursAr[t.weekday - 1]} ${t.day} ${_moisAr[t.month - 1]} ${t.year}';
  final j = _joursLongFr[t.weekday - 1];
  return '${j[0].toUpperCase()}${j.substring(1)} ${t.day} ${_moisLongFr[t.month - 1]} ${t.year}';
}
