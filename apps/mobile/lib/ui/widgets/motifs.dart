import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Motif de zellige (étoile à huit branches répétée), dessiné en traits fins.
class ZelligePainter extends CustomPainter {
  ZelligePainter({required this.couleur, this.opacite = 0.12, this.pas = 56});
  final Color couleur;
  final double opacite;
  final double pas;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = couleur.withValues(alpha: opacite)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final c = pas * 12 / 56; // demi-côté du carré
    for (double y = 0; y < size.height + pas; y += pas) {
      for (double x = 0; x < size.width + pas; x += pas) {
        final centre = Offset(x + pas / 2, y + pas / 2);
        final carre = Rect.fromCenter(center: centre, width: 2 * c, height: 2 * c);
        canvas.drawRect(carre, p);
        canvas.save();
        canvas.translate(centre.dx, centre.dy);
        canvas.rotate(math.pi / 4);
        canvas.drawRect(Rect.fromCenter(center: Offset.zero, width: 2 * c, height: 2 * c), p);
        canvas.restore();
        canvas.drawCircle(centre, c / 3, p);
      }
    }
  }

  @override
  bool shouldRepaint(covariant ZelligePainter old) => old.couleur != couleur || old.opacite != opacite;
}

/// Fond coloré avec motif de zellige.
class FondZellige extends StatelessWidget {
  const FondZellige({super.key, required this.couleur, required this.motif, required this.child, this.opacite = 0.12});
  final Color couleur;
  final Color motif;
  final Widget child;
  final double opacite;

  @override
  Widget build(BuildContext context) => Container(
        color: couleur,
        child: CustomPaint(painter: ZelligePainter(couleur: motif, opacite: opacite), child: child),
      );
}

/// Étoile à huit branches (khatam), utilisée devant les titres.
class Etoile extends StatelessWidget {
  const Etoile({super.key, this.taille = 16, this.couleur = const Color(0xFFF2A900)});
  final double taille;
  final Color couleur;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: taille,
        height: taille,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(width: taille * 0.62, height: taille * 0.62, color: couleur),
            Transform.rotate(angle: math.pi / 4, child: Container(width: taille * 0.62, height: taille * 0.62, color: couleur)),
          ],
        ),
      );
}
