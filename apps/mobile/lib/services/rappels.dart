import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timezone/timezone.dart' as tz;

import '../data/dates.dart';
import '../data/favoris.dart';

/// Rappels de sorties : notifications programmées sur le téléphone, sans compte ni serveur.
/// Dans le navigateur (tests dans Chrome), rien n'est programmé : [disponible] vaut false.
class Rappels {
  // Créé seulement sur Android (jamais dans le navigateur)
  late final _plugin = FlutterLocalNotificationsPlugin();
  bool _pret = false;

  /// Slug de l'événement ouvert en touchant un rappel (appli fermée au moment du toucher).
  String? slugAuDemarrage;

  bool get disponible => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  /// À appeler une fois au démarrage. [surToucher] reçoit le slug de l'événement du rappel touché.
  Future<void> initialiser(void Function(String slug) surToucher) async {
    if (!disponible) return;
    try {
      await _plugin.initialize(
        settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')),
        onDidReceiveNotificationResponse: (r) {
          if ((r.payload ?? '').isNotEmpty) surToucher(r.payload!);
        },
      );
      final lancement = await _plugin.getNotificationAppLaunchDetails();
      if (lancement?.didNotificationLaunchApp ?? false) {
        slugAuDemarrage = lancement!.notificationResponse?.payload;
      }
      _pret = true;
    } catch (_) {
      // Un échec ici ne doit jamais empêcher l'application de démarrer
    }
  }

  /// Demande l'autorisation d'afficher des notifications (Android 13 et plus). true si accordée.
  Future<bool> demanderAutorisation() async {
    if (!_pret) return false;
    final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    return await android?.requestNotificationsPermission() ?? false;
  }

  /// Identifiant stable d'une notification : même événement + même moment = même numéro,
  /// pour pouvoir la remplacer ou l'annuler.
  static int identifiant(String evenementId, Rappel r) {
    var h = 0x811c9dc5; // FNV-1a 32 bits
    for (final c in evenementId.codeUnits) {
      h = ((h ^ c) * 0x01000193) & 0xffffffff;
    }
    return ((h & 0x0fffffff) << 2) | r.index; // positif et < 2^31
  }

  Future<void> annuler(Favori f) async {
    if (!_pret) return;
    for (final r in Rappel.values) {
      await _plugin.cancel(id: identifiant(f.id, r));
    }
  }

  static NotificationDetails _details(bool ar) => NotificationDetails(
        android: AndroidNotificationDetails(
          'rappels_sorties',
          ar ? 'تذكير بالخرجات' : 'Rappels de sorties',
          channelDescription: ar ? 'تذكير قبل الفعاليات التي اخترتها' : 'Rappels avant les événements que vous avez choisis',
          importance: Importance.high,
          priority: Priority.high,
        ),
      );

  /// Essai sur le téléphone (appui long sur le titre « Mes sorties ») : une notification programmée
  /// dans 30 secondes, par le même chemin que les vrais rappels. false si indisponible ou refusé.
  Future<bool> tester(String langue) async {
    if (!_pret || !await demanderAutorisation()) return false;
    final ar = langue == 'ar';
    await _plugin.zonedSchedule(
      id: 1,
      title: 'WA9TECH',
      body: ar ? 'تجربة التذكير: يعمل ✓' : 'Test des rappels : ça fonctionne ✓',
      scheduledDate: tz.TZDateTime.now(tz.UTC).add(const Duration(seconds: 30)),
      notificationDetails: _details(ar),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
    );
    return true;
  }

  /// (Re)programme les rappels d'une sortie pour sa prochaine date.
  Future<void> programmer(Favori f, String langue) async {
    if (!_pret) return;
    await annuler(f);
    final debut = f.carte.prochaineDate;
    if (debut == null) return;
    final ar = langue == 'ar';
    final titre = f.carte.titre(langue);
    final lieu = f.carte.lieuNom;
    final details = _details(ar);
    for (final (:rappel, :quand) in instantsRappel(debut, f.rappels)) {
      final quandTexte = switch (rappel) {
        Rappel.veille => ar ? 'غدًا على ${heure(debut)}' : 'Demain à ${heure(debut)}',
        Rappel.avant3h => ar ? 'بعد 3 ساعات، على ${heure(debut)}' : 'Dans 3 heures, à ${heure(debut)}',
      };
      await _plugin.zonedSchedule(
        id: identifiant(f.id, rappel),
        title: titre,
        body: [quandTexte, if ((lieu ?? '').isNotEmpty) lieu].join(' · '),
        scheduledDate: tz.TZDateTime.from(quand, tz.UTC),
        notificationDetails: details,
        // Heure approximative (quelques minutes) : pas besoin de l'autorisation « alarmes exactes »
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        payload: f.carte.slug,
      );
    }
  }
}

final rappelsProvider = Provider<Rappels>((ref) => Rappels());
