import 'package:flutter/widgets.dart';

/// Textes de l'application en français et en arabe (mêmes formulations que le site).
class T {
  const T._(this.ar);
  final bool ar;

  static T of(BuildContext context) => T._(Localizations.localeOf(context).languageCode == 'ar');

  String _t(String fr, String arabe) => ar ? arabe : fr;

  String get slogan => _t("L'agenda culturel de la Tunisie", 'الأجندة الثقافية لتونس');
  String get accroche => _t('Quand ? Où ? Quoi ?', 'وقتاش؟ وين؟ شنوّة؟');
  String get accueil => _t('Accueil', 'الرئيسية');
  String get agenda => _t('Agenda', 'الأجندة');
  String get rechercher => _t('Rechercher', 'بحث');
  String get quoi => _t('Un artiste, un spectacle…', 'فنان، عرض…');
  String get partout => _t('Toute la Tunisie', 'كلّ تونس');
  String get aLaUne => _t('À la une', 'مختارات');
  String get ceSoir => _t("Aujourd'hui", 'اليوم');
  String get ceWeekend => _t('Ce week-end', 'نهاية الأسبوع');
  String get bientot => _t('Bientôt', 'قريبًا');
  String get voirTout => _t('Voir tout', 'عرض الكلّ');
  String get disciplines => _t('Disciplines', 'الفنون');
  String get villes => _t('Villes', 'المدن');
  String get gratuit => _t('Gratuit', 'مجاني');
  String get aucunResultat => _t('Aucun événement ne correspond pour le moment.', 'لا توجد فعاليات مطابقة حاليًا.');
  String get erreurReseau => _t('Connexion impossible. Vérifiez votre accès internet.', 'تعذّر الاتصال. تثبّت من الإنترنت.');
  String get reessayer => _t('Réessayer', 'أعد المحاولة');
  String get dates => _t('Dates', 'المواعيد');
  String get lieu => _t('Lieu', 'المكان');
  String get itineraire => _t('Itinéraire', 'الطريق');
  String get appeler => _t('Appeler', 'اتصل');
  String get plusInfos => _t("Plus d'infos", 'مزيد من المعلومات');
  String get partager => _t('Partager', 'شارك');
  String get avec => _t('Avec', 'بمشاركة');
  String get organisePar => _t('Organisé par', 'تنظيم');
  String get similaires => _t('Vous aimerez aussi', 'قد يعجبك أيضًا');
  String get prixNonCommunique => _t('Tarif non communiqué', 'السعر غير معلن');
  String get dt => _t('DT', 'د.ت');
  String get votreSortie => _t('Votre sortie', 'خرجتك');
  String get prochainesDates => _t('Prochaines dates', 'المواعيد القادمة');
  String get aVenirIci => _t('À venir dans ce lieu', 'قريبًا في هذا المكان');
  String get artiste => _t('Artiste', 'فنان');
  String get toutes => _t('Toutes', 'الكلّ');
  String get langue => _t('العربية', 'Français');
  String get verifie => _t('Information vérifiée', 'معلومة موثّقة');
  String nbEvenements(int n) => ar ? '$n فعالية' : (n > 1 ? '$n événements' : '$n événement');

  String periode(int i) => [
        _t('À venir', 'القادمة'),
        _t("Aujourd'hui", 'اليوم'),
        _t('Demain', 'غدًا'),
        _t('Ce week-end', 'نهاية الأسبوع'),
        _t('Cette semaine', 'هذا الأسبوع'),
        _t('Ce mois-ci', 'هذا الشهر'),
      ][i];
}
