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
  String get mesSorties => _t('Mes sorties', 'خرجاتي');
  String get ajouterSorties => _t('Ajouter à mes sorties', 'أضف إلى خرجاتي');
  String get retirerSorties => _t('Retirer de mes sorties', 'احذف من خرجاتي');
  String get ajoute => _t('Ajouté à vos sorties', 'تمت الإضافة إلى خرجاتك');
  String get retire => _t('Retiré de vos sorties', 'تم الحذف من خرجاتك');
  String get sortiesVide =>
      _t('Touchez le cœur d\'un événement pour le retrouver ici.', 'اضغط على القلب في أي فعالية لتجدها هنا.');
  String get aVenirSorties => _t('À venir', 'القادمة');
  String get passees => _t('Passées ou sans date', 'منتهية أو بلا تاريخ');
  String get meRappeler => _t('Me rappeler', 'ذكّرني');
  String get rappels => _t('Rappels', 'التذكير');
  String get rappelVeille => _t('La veille, à 18 h', 'في اليوم السابق، على 18:00');
  String get rappel3h => _t('3 heures avant', 'قبل 3 ساعات');
  String get valider => _t('Valider', 'تأكيد');
  String get rappelsProgrammes => _t('Rappel programmé', 'تمّت برمجة التذكير');
  String get rappelsAnnules => _t('Rappels désactivés', 'تمّ إلغاء التذكير');
  String get rappelsTelephone =>
      _t("Les rappels fonctionnent dans l'application Android.", 'التذكير يعمل في تطبيق أندرويد.');
  String get autorisationRefusee => _t(
        "Notifications refusées : autorisez-les dans les réglages du téléphone.",
        'الإشعارات مرفوضة: فعّلها من إعدادات الهاتف.',
      );
  String get rappelTest =>
      _t('Notification de test dans 30 secondes environ (parfois 1 à 2 minutes).', 'إشعار تجريبي بعد 30 ثانية تقريبًا (أحيانًا دقيقة أو دقيقتين).');
  String get sansDate => _t('Pas de date à venir', 'لا يوجد موعد قادم');
  String get autourDeMoi => _t('Autour de moi', 'حولي');
  String get rechercherZone => _t('Rechercher dans cette zone', 'ابحث في هذه المنطقة');
  String get maPosition => _t('Ma position', 'موقعي');
  String get positionIndisponible =>
      _t('Position indisponible : la carte est centrée sur Tunis.', 'الموقع غير متاح: الخريطة على تونس العاصمة.');
  String get aucunAutour => _t('Aucun événement dans cette zone pour cette période.', 'لا توجد فعاليات في هذه المنطقة لهذه الفترة.');
  String get voirLieu => _t('Voir le lieu', 'صفحة المكان');
  String distance(double km) => ar
      ? '${km < 10 ? km.toStringAsFixed(1) : km.round()} كم'
      : '${km < 10 ? km.toStringAsFixed(1).replaceAll('.', ',') : km.round()} km';
  String nbAutour(int n, int km) => ar
      ? '$n فعالية على بعد $km كم'
      : '$n ${n > 1 ? 'événements' : 'événement'} à moins de $km km';
  // Proposer un événement (mêmes textes que le site)
  String get proposer => _t('Proposer un événement', 'اقترح فعالية');
  String get proposerCourt => _t('Proposer', 'اقترح');
  String get proposerSurtitre => _t('Organisateurs, artistes, lieux', 'منظّمون، فنانون، فضاءات');
  String get proposerIntro => _t(
        "Envoyez-nous l'affiche de votre événement : notre équipe la lit, vérifie les informations et la publie gratuitement sur WA9TECH.",
        'أرسل لنا معلّقة فعاليتك: يقرأها فريقنا، يتثبّت من المعلومات وينشرها مجانًا على وقتاش.',
      );
  String get proposerAppel => _t('Vous organisez un événement ?', 'تنظّم فعالية؟');
  String get champAffiche => _t("L'affiche", 'المعلّقة');
  String get choisirAffiche => _t("Choisir l'affiche", 'اختر المعلّقة');
  String get formatsAffiche => _t('Une photo nette suffit', 'صورة واضحة تكفي');
  String get changerAffiche => _t("Changer d'image", 'تغيير الصورة');
  String get galerie => _t('Galerie', 'المعرض');
  String get appareilPhoto => _t('Appareil photo', 'الكاميرا');
  String get champMessage => _t('Informations complémentaires (facultatif)', 'معلومات إضافية (اختياري)');
  String get aideMessage =>
      _t('Prix, réservation, lien de la billetterie, précisions sur le lieu…', 'السعر، الحجز، رابط التذاكر، تفاصيل عن المكان…');
  String get champNom => _t('Votre nom ou celui de la structure', 'اسمك أو اسم الهيكل');
  String get champContact => _t('Téléphone ou e-mail', 'الهاتف أو البريد الإلكتروني');
  String get aideContact =>
      _t('Uniquement pour vous joindre en cas de question. Jamais publié.', 'للتواصل معك عند الحاجة فقط. لا يُنشر أبدًا.');
  String get consentement => _t(
        "J'accepte que WA9TECH utilise cette affiche et ces informations pour publier l'événement. Mes coordonnées sont supprimées après 6 mois.",
        'أوافق على أن تستعمل وقتاش هذه المعلّقة وهذه المعلومات لنشر الفعالية. تُحذف بياناتي بعد 6 أشهر.',
      );
  String get envoyer => _t("Envoyer l'affiche", 'أرسل المعلّقة');
  String get envoiEnCours => _t('Envoi en cours…', 'جارٍ الإرسال…');
  String get merciTitre => _t('Merci, affiche bien reçue !', 'شكرًا، وصلتنا المعلّقة!');
  String get merciTexte => _t(
        "Notre équipe va vérifier les informations. L'événement apparaîtra dans l'agenda dès sa validation, en général sous 48 heures.",
        'سيتثبّت فريقنا من المعلومات. ستظهر الفعالية في الأجندة فور المصادقة عليها، عادةً خلال 48 ساعة.',
      );
  String get proposerAutre => _t('Proposer un autre événement', 'اقترح فعالية أخرى');
  String get retourAccueil => _t("Retour à l'accueil", 'العودة إلى الرئيسية');
  String get erreurChamps => _t('Merci de vérifier les champs signalés.', 'يرجى مراجعة الخانات المشار إليها.');
  String get erreurImage => _t(
        "Cette image n'est pas acceptée (JPG, PNG ou WebP de moins de 3 Mo).",
        'هذه الصورة غير مقبولة (JPG أو PNG أو WebP أقل من 3 ميغابايت).',
      );
  String get erreurTrop => _t(
        'Vous avez déjà envoyé plusieurs affiches : merci de réessayer dans une heure.',
        'أرسلت عدّة معلّقات: يرجى المحاولة بعد ساعة.',
      );
  String get erreurServeur => _t("L'envoi n'a pas abouti. Réessayez dans un instant.", 'لم يتمّ الإرسال. أعد المحاولة بعد قليل.');
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
