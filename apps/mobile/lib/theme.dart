import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Charte WA9TECH (voir docs/marque/README.md).
class Couleurs {
  static const terracotta = Color(0xFFB5452B);
  static const bleu = Color(0xFF1E5AA8);
  static const safran = Color(0xFFF2A900);
  static const encre = Color(0xFF1A1A1A);
  static const sable = Color(0xFFFAF8F5);
  static const vert = Color(0xFF2E7D6B);
  static const succes = Color(0xFF2E7D4F);
  static const bordure = Color(0xFFE6E0D9);
  static const discret = Color(0xFF6B6560);
  static const accent = Color(0xFFF8E9E4);
}

/// Teinte (fond, texte) d'une discipline, dans le même ordre que sur le site.
const teintes = <(Color, Color)>[
  (Couleurs.terracotta, Colors.white),
  (Couleurs.bleu, Colors.white),
  (Couleurs.safran, Couleurs.encre),
  (Couleurs.encre, Couleurs.sable),
  (Couleurs.vert, Colors.white),
];

ThemeData construireTheme({required bool arabe}) {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: Couleurs.terracotta,
      primary: Couleurs.terracotta,
      secondary: Couleurs.bleu,
      tertiary: Couleurs.safran,
      surface: Couleurs.sable,
      onSurface: Couleurs.encre,
    ),
    scaffoldBackgroundColor: Couleurs.sable,
  );
  // Rubik pour le latin, Noto Sans Arabic pour l'arabe (téléchargées puis mises en cache par google_fonts)
  final famille = arabe ? GoogleFonts.notoSansArabic().fontFamily : GoogleFonts.rubik().fontFamily;
  return base.copyWith(
    textTheme: base.textTheme.apply(fontFamily: famille, bodyColor: Couleurs.encre, displayColor: Couleurs.encre),
    appBarTheme: const AppBarTheme(
      backgroundColor: Couleurs.sable,
      foregroundColor: Couleurs.encre,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
    ),
    chipTheme: base.chipTheme.copyWith(
      side: const BorderSide(color: Couleurs.bordure, width: 1.5),
      shape: const StadiumBorder(),
      selectedColor: Couleurs.encre,
      checkmarkColor: Couleurs.sable,
      backgroundColor: Colors.white,
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: Couleurs.accent,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Couleurs.bordure)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Couleurs.bordure)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Couleurs.terracotta, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
  );
}

/// Style des grands titres (Rubik extra-gras en latin).
TextStyle styleTitre(BuildContext context, {double taille = 26, Color? couleur}) {
  final arabe = Localizations.localeOf(context).languageCode == 'ar';
  final s = TextStyle(fontSize: taille, fontWeight: FontWeight.w800, height: 1.1, color: couleur ?? Couleurs.encre);
  return arabe ? GoogleFonts.notoSansArabic(textStyle: s) : GoogleFonts.rubik(textStyle: s);
}
