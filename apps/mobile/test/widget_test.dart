import 'package:flutter_test/flutter_test.dart';
import 'package:wa9tech/data/dates.dart';
import 'package:wa9tech/data/favoris.dart';
import 'package:wa9tech/data/modeles.dart';
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
}
