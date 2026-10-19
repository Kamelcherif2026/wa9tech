import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wa9tech/data/dates.dart';
import 'package:wa9tech/data/favoris.dart';
import 'package:wa9tech/data/modeles.dart';
import 'package:wa9tech/data/proposition.dart';
import 'package:wa9tech/services/rappels.dart';

void main() {
  test('heure de Tunis (UTC+1)', () {
    expect(heure(DateTime.utc(2026, 10, 23, 18, 0)), '19:00');
  });

  test('week-end : du vendredi 17 h au dimanche soir', () {
    // Mercredi 21 octobre 2026, 10 h à Tunis
    final f = fenetre(Periode.weekend, DateTime.utc(2026, 10, 21, 9));
    expect(versTunis(f.debut), DateTime.utc(2026, 10, 23, 17));
    expect(versTunis(f.fin!), DateTime.utc(2026, 10, 25, 23, 59, 59));
  });

  test('date longue en arabe avec les mois tunisiens', () {
    expect(dateLongue(DateTime.utc(2026, 10, 23, 18), 'ar'), 'الجمعة 23 أكتوبر 2026');
  });

  // Spectacle le vendredi 23 octobre 2026 à 19 h (Tunis) = 18 h UTC
  final debut = DateTime.utc(2026, 10, 23, 18);

  test('rappels : la veille à 18 h et 3 heures avant', () {
    final r = instantsRappel(debut, {Rappel.veille, Rappel.avant3h}, DateTime.utc(2026, 10, 20));
    expect(r.map((x) => x.rappel), [Rappel.veille, Rappel.avant3h]);
    expect(r[0].quand, DateTime.utc(2026, 10, 22, 17)); // jeudi 18 h à Tunis
    expect(r[1].quand, DateTime.utc(2026, 10, 23, 15)); // vendredi 16 h à Tunis
  });

  test('rappels déjà passés ignorés', () {
    final r = instantsRappel(debut, {Rappel.veille, Rappel.avant3h}, DateTime.utc(2026, 10, 23, 10));
    expect(r.map((x) => x.rappel), [Rappel.avant3h]);
  });

  test('identifiant de notification stable, positif et distinct par rappel', () {
    const id = '7b0c1c2e-1111-4a4a-9999-123456789abc';
    final a = Rappels.identifiant(id, Rappel.veille);
    expect(a, Rappels.identifiant(id, Rappel.veille));
    expect(a, isNot(Rappels.identifiant(id, Rappel.avant3h)));
    expect(a, inInclusiveRange(0, 0x7fffffff));
  });

  test('favori : aller-retour JSON', () {
    final f = Favori(
      carte: Carte(id: 'x', slug: 'halouaset-bahjet', titreFr: 'Halouaset Bahjet', titreAr: 'هلوسات بهجت', prochaineDate: debut, gratuit: true),
      rappels: {Rappel.veille},
    );
    final g = Favori.depuisJson(f.versJson());
    expect(g.carte.slug, 'halouaset-bahjet');
    expect(g.carte.titreAr, 'هلوسات بهجت');
    expect(g.carte.prochaineDate, debut);
    expect(g.carte.gratuit, true);
    expect(g.rappels, {Rappel.veille});
  });

  test('événement proche : lecture de la réponse de evenements_proches', () {
    final p = Proche.depuis({
      'id': 'x',
      'slug': 'concert',
      'titre_fr': 'Concert',
      'image': 'https://exemple.tn/a.jpg',
      'categorie_id': 1,
      'lieu_nom': 'Théâtre municipal',
      'lieu_nom_ar': 'المسرح البلدي',
      'lieu_slug': 'theatre-municipal-sfax',
      'prochaine_date': '2026-10-23T18:00:00+00:00',
      'gratuit': true,
      'distance_km': 1.2,
      'lat': 34.7406,
      'lng': 10.7603,
      'ville_id': 3,
    });
    expect(p.carte.image, 'https://exemple.tn/a.jpg');
    expect(p.carte.villeId, 3);
    expect(p.nomLieu('ar'), 'المسرح البلدي');
    expect(p.nomLieu('fr'), 'Théâtre municipal');
    expect(p.distanceKm, 1.2);
    expect(p.lat, 34.7406);
  });

  // Proposer un événement
  final jpeg = Uint8List.fromList([0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 0x4A, 0x46]);

  test('type d\'image reconnu par ses premiers octets', () {
    expect(typeImage(jpeg), 'image/jpeg');
    expect(typeImage(Uint8List.fromList([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])), 'image/png');
    expect(typeImage(Uint8List.fromList(ascii.encode('RIFF0000WEBPVP8 '))), 'image/webp');
    expect(typeImage(Uint8List.fromList(ascii.encode('<html>pas une image'))), isNull);
  });

  test('vérification avant envoi : mêmes règles que le site', () {
    expect(verifierProposition(nom: 'Kamel', contact: '+216 55 55 05 05', consentement: true, affiche: jpeg), isEmpty);
    expect(verifierProposition(nom: 'Kamel', contact: 'kamel@wa9tech.tn', consentement: true, affiche: jpeg), isEmpty);
    expect(
      verifierProposition(nom: 'K', contact: 'abc', consentement: false),
      {'nom', 'contact', 'consentement', 'affiche'},
    );
  });

  test('envoi : champs du formulaire et réponse ok', () async {
    late http.Request recue;
    final client = MockClient((r) async {
      recue = r;
      return http.Response('{"ok":true}', 200, headers: {'content-type': 'application/json'});
    });
    final r = await envoyerProposition(affiche: jpeg, nom: ' Kamel ', contact: '55550505', message: 'Entrée libre', client: client);
    expect(r.ok, isTrue);
    expect(recue.url.path, '/api/proposer');
    final corps = utf8.decode(recue.bodyBytes, allowMalformed: true);
    expect(corps, contains('name="nom"'));
    expect(corps, contains('Kamel'));
    expect(corps, contains('name="consentement"'));
    expect(corps, contains('filename="affiche.jpg"'));
    expect(corps, contains('content-type: image/jpeg'));
  });

  test('envoi : erreurs du serveur et coupure réseau', () async {
    final trop = await envoyerProposition(
      affiche: jpeg,
      nom: 'Kamel',
      contact: '55550505',
      client: MockClient((_) async => http.Response('{"erreur":"trop"}', 429)),
    );
    expect(trop.erreur, ErreurProposition.trop);

    final champs = await envoyerProposition(
      affiche: jpeg,
      nom: 'Kamel',
      contact: '55550505',
      client: MockClient((_) async => http.Response('{"erreur":"champs","champs":{"contact":true}}', 400)),
    );
    expect(champs.champs, {'contact'});

    final coupure = await envoyerProposition(
      affiche: jpeg,
      nom: 'Kamel',
      contact: '55550505',
      client: MockClient((_) async => throw http.ClientException('hors ligne')),
    );
    expect(coupure.erreur, ErreurProposition.serveur);

    final pasImage = await envoyerProposition(affiche: Uint8List.fromList([1, 2, 3]), nom: 'Kamel', contact: '55550505');
    expect(pasImage.erreur, ErreurProposition.image);
  });
}
