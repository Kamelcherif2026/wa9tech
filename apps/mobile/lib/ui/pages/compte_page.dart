import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config.dart';
import '../../data/compte.dart';
import '../../i18n.dart';
import '../../theme.dart';
import '../widgets/communs.dart';
import '../widgets/motifs.dart';

/// « Mon compte » : connexion Google (facultative), puis l'espace du compte.
/// Les sorties et rappels restent sur le téléphone, avec ou sans compte.
class ComptePage extends ConsumerStatefulWidget {
  const ComptePage({super.key});

  @override
  ConsumerState<ComptePage> createState() => _ComptePageState();
}

class _ComptePageState extends ConsumerState<ComptePage> {
  bool _enCours = false;

  Future<void> _connecter() async {
    final t = T.of(context);
    setState(() => _enCours = true);
    try {
      await connecterAvecGoogle();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.erreurConnexion)));
      }
    } finally {
      // Le navigateur s'ouvre ; la connexion se termine au retour dans l'application
      if (mounted) setState(() => _enCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    final session = ref.watch(sessionProvider);
    final connecte = session.value != null;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: FondZellige(
              couleur: Couleurs.encre,
              motif: Colors.white,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 4, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const BackButton(color: Colors.white),
                      Padding(
                        padding: const EdgeInsetsDirectional.only(start: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text((connecte ? t.monCompte : t.connexionSurtitre).toUpperCase(),
                                style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                            const SizedBox(height: 4),
                            Text(connecte ? t.monCompte : t.connexionTitre,
                                style: styleTitre(context, taille: 30, couleur: Colors.white)),
                            if (!connecte) ...[
                              const SizedBox(height: 8),
                              Text(t.connexionIntro, style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.4)),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
            sliver: SliverToBoxAdapter(
              child: session.isLoading && !session.hasValue
                  ? const Chargement()
                  : connecte
                      ? const _Espace()
                      : _Connexion(enCours: _enCours, surGoogle: _connecter),
            ),
          ),
        ],
      ),
    );
  }
}

class _Connexion extends StatelessWidget {
  const _Connexion({required this.enCours, required this.surGoogle});
  final bool enCours;
  final VoidCallback surGoogle;

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton.icon(
          onPressed: enCours ? null : surGoogle,
          style: OutlinedButton.styleFrom(
            foregroundColor: Couleurs.encre,
            side: const BorderSide(color: Couleurs.encre, width: 2),
            shape: const StadiumBorder(),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          icon: enCours
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const _LogoGoogle(),
          label: Text(t.continuerGoogle, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        ),
        const SizedBox(height: 16),
        Text(t.conditionsConnexion,
            textAlign: TextAlign.center, style: const TextStyle(color: Couleurs.discret, fontSize: 13, height: 1.4)),
        const SizedBox(height: 8),
        Text(t.sortiesSurTelephone,
            textAlign: TextAlign.center, style: const TextStyle(color: Couleurs.discret, fontSize: 13, height: 1.4)),
      ],
    );
  }
}

/// « G » de Google dessiné en texte coloré (pas d'image à embarquer).
class _LogoGoogle extends StatelessWidget {
  const _LogoGoogle();

  @override
  Widget build(BuildContext context) => const Text('G',
      style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 20, fontFamily: 'Roboto'));
}

class _Espace extends ConsumerWidget {
  const _Espace();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = T.of(context);
    final profil = ref.watch(profilProvider);

    return profil.when(
      loading: () => const Chargement(),
      error: (e, pile) => ErreurChargement(surReessayer: () => ref.invalidate(profilProvider)),
      data: (p) {
        if (p == null) return const Chargement();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Carte(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p.nom != null ? '${t.bonjour} ${p.nom}' : t.bonjour, style: styleTitre(context, taille: 22)),
                  const SizedBox(height: 4),
                  Directionality(
                    textDirection: TextDirection.ltr,
                    child: Text(p.email, style: const TextStyle(color: Couleurs.discret)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (p.structure != null)
              _Carte(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.maStructure.toUpperCase(),
                        style: const TextStyle(color: Couleurs.discret, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                    const SizedBox(height: 4),
                    Text(p.structure!, style: styleTitre(context, taille: 20)),
                    const SizedBox(height: 8),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      if (!p.structureValidee) _Pastille(t.structureEnAttente, Couleurs.safran),
                      if (p.confiance) _Pastille(t.badgeConfiance, Couleurs.vert),
                    ]),
                  ],
                ),
              )
            else
              FondZellige(
                couleur: Couleurs.terracotta,
                motif: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.devenirOrganisateur, style: styleTitre(context, taille: 20, couleur: Colors.white)),
                      const SizedBox(height: 8),
                      Text(t.devenirOrganisateurTexte, style: const TextStyle(color: Colors.white, height: 1.4)),
                      const SizedBox(height: 12),
                      _Pastille(t.bientotDisponible, Colors.white24, texte: Colors.white),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 16),
            if (p.staff)
              _Action(
                icone: Icons.admin_panel_settings_outlined,
                texte: t.accesBackOffice,
                surToucher: () => launchUrl(Uri.parse('${Config.siteUrl}/admin'), mode: LaunchMode.externalApplication),
              ),
            _Action(icone: Icons.logout, texte: t.seDeconnecter, surToucher: deconnecter),
          ],
        );
      },
    );
  }
}

class _Carte extends StatelessWidget {
  const _Carte({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Couleurs.bordure, width: 2),
        ),
        child: child,
      );
}

class _Pastille extends StatelessWidget {
  const _Pastille(this.libelle, this.fond, {this.texte = Colors.white});
  final String libelle;
  final Color fond, texte;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: fond, borderRadius: BorderRadius.circular(999)),
        child: Text(libelle, style: TextStyle(color: texte, fontWeight: FontWeight.w800, fontSize: 13)),
      );
}

class _Action extends StatelessWidget {
  const _Action({required this.icone, required this.texte, required this.surToucher});
  final IconData icone;
  final String texte;
  final VoidCallback surToucher;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Material(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Couleurs.bordure, width: 2),
          ),
          child: ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            leading: Icon(icone, color: Couleurs.terracotta),
            title: Text(texte, style: const TextStyle(fontWeight: FontWeight.w800)),
            onTap: surToucher,
          ),
        ),
      );
}
