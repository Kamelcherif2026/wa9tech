import 'package:flutter_test/flutter_test.dart';
import 'package:wa9tech/data/dates.dart';

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
}
