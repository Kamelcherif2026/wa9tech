import 'package:flutter/material.dart';

/// Icône de chaque discipline (mêmes correspondances que le site).
const iconesDisciplines = <String, IconData>{
  'musique': Icons.music_note_rounded,
  'theatre': Icons.theater_comedy_rounded,
  'cinema': Icons.movie_rounded,
  'arts-visuels': Icons.palette_rounded,
  'danse': Icons.sports_gymnastics_rounded,
  'festivals': Icons.celebration_rounded,
  'rencontres': Icons.mic_rounded,
  'ateliers': Icons.handyman_rounded,
  'patrimoine': Icons.account_balance_rounded,
  'jeune-public': Icons.child_care_rounded,
};

IconData iconeDiscipline(String? slug) => iconesDisciplines[slug] ?? Icons.auto_awesome_rounded;
