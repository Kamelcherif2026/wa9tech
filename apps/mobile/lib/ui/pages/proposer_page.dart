import 'package:flutter/foundation.dart' show kIsWeb, Uint8List;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../data/favoris.dart' show prefsProvider;
import '../../data/proposition.dart';
import '../../i18n.dart';
import '../../theme.dart';
import '../widgets/motifs.dart';

/// « Proposer un événement » : l'affiche, quelques informations, l'envoi. Le nom et le contact
/// sont gardés sur le téléphone pour la prochaine fois.
class ProposerPage extends ConsumerStatefulWidget {
  const ProposerPage({super.key});

  @override
  ConsumerState<ProposerPage> createState() => _ProposerPageState();
}

class _ProposerPageState extends ConsumerState<ProposerPage> {
  static const _cleNom = 'proposer_nom', _cleContact = 'proposer_contact';

  late final TextEditingController _nom, _contact;
  final _message = TextEditingController();
  Uint8List? _affiche;
  bool _consentement = false, _enCours = false, _envoye = false;
  Set<String> _champs = {};
  ErreurProposition? _erreur;

  @override
  void initState() {
    super.initState();
    final prefs = ref.read(prefsProvider);
    _nom = TextEditingController(text: prefs.getString(_cleNom) ?? '');
    _contact = TextEditingController(text: prefs.getString(_cleContact) ?? '');
  }

  @override
  void dispose() {
    _nom.dispose();
    _contact.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _choisir() async {
    final t = T.of(context);
    // Dans le navigateur (tests), seulement les fichiers ; sur le téléphone, galerie ou appareil photo
    final source = kIsWeb
        ? ImageSource.gallery
        : await showModalBottomSheet<ImageSource>(
            context: context,
            showDragHandle: true,
            builder: (context) => SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                    leading: const Icon(Icons.photo_library_outlined),
                    title: Text(t.galerie),
                    onTap: () => Navigator.pop(context, ImageSource.gallery),
                  ),
                  ListTile(
                    leading: const Icon(Icons.photo_camera_outlined),
                    title: Text(t.appareilPhoto),
                    onTap: () => Navigator.pop(context, ImageSource.camera),
                  ),
                ],
              ),
            ),
          );
    if (source == null) return;
    // Réduite et compressée sur le téléphone : envoi rapide même en 3G, bien lisible pour l'IA
    final fichier = await ImagePicker().pickImage(source: source, maxWidth: 1600, maxHeight: 2400, imageQuality: 82);
    if (fichier == null) return;
    final octets = await fichier.readAsBytes();
    if (!mounted) return;
    final valide = typeImage(octets) != null && octets.length <= tailleMaxAffiche;
    setState(() {
      _affiche = valide ? octets : null;
      _erreur = valide ? null : ErreurProposition.image;
      _champs = {..._champs}..remove('affiche');
      if (!valide) _champs.add('affiche');
    });
  }

  Future<void> _envoyer() async {
    FocusScope.of(context).unfocus();
    final champs = verifierProposition(nom: _nom.text, contact: _contact.text, consentement: _consentement, affiche: _affiche);
    if (champs.isNotEmpty) {
      setState(() {
        _champs = champs;
        _erreur = ErreurProposition.champs;
      });
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
      _champs = {};
    });
    final r = await envoyerProposition(affiche: _affiche!, nom: _nom.text, contact: _contact.text, message: _message.text);
    if (!mounted) return;
    if (r.ok) {
      final prefs = ref.read(prefsProvider);
      await prefs.setString(_cleNom, _nom.text.trim());
      await prefs.setString(_cleContact, _contact.text.trim());
    }
    if (!mounted) return;
    setState(() {
      _enCours = false;
      _envoye = r.ok;
      _erreur = r.erreur;
      _champs = r.champs;
    });
  }

  void _recommencer() => setState(() {
        _envoye = false;
        _affiche = null;
        _consentement = false;
        _message.clear();
      });

  String _texteErreur(T t, ErreurProposition e) => switch (e) {
        ErreurProposition.champs => t.erreurChamps,
        ErreurProposition.image => t.erreurImage,
        ErreurProposition.trop => t.erreurTrop,
        ErreurProposition.serveur => t.erreurServeur,
      };

  @override
  Widget build(BuildContext context) {
    final t = T.of(context);
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: FondZellige(
              couleur: Couleurs.terracotta,
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
                            Text(t.proposerSurtitre.toUpperCase(),
                                style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                            const SizedBox(height: 4),
                            Text(t.proposer, style: styleTitre(context, taille: 30, couleur: Colors.white)),
                            const SizedBox(height: 8),
                            Text(t.proposerIntro, style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.4)),
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
            sliver: SliverToBoxAdapter(child: _envoye ? _merci(t) : _formulaire(t)),
          ),
        ],
      ),
    );
  }

  Widget _merci(T t) => Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Couleurs.bordure, width: 2),
        ),
        child: Column(
          children: [
            const Icon(Icons.check_circle_outline, size: 64, color: Couleurs.vert),
            const SizedBox(height: 12),
            Text(t.merciTitre, textAlign: TextAlign.center, style: styleTitre(context, taille: 24)),
            const SizedBox(height: 8),
            Text(t.merciTexte, textAlign: TextAlign.center, style: const TextStyle(color: Couleurs.discret, height: 1.4)),
            const SizedBox(height: 20),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: Couleurs.encre,
                side: const BorderSide(color: Couleurs.encre, width: 2),
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: _recommencer,
              child: Text(t.proposerAutre),
            ),
            TextButton(onPressed: () => context.go('/'), child: Text(t.retourAccueil)),
          ],
        ),
      );

  Widget _formulaire(T t) {
    InputDecoration deco(String libelle, {String? aide, bool erreur = false}) => InputDecoration(
          labelText: libelle,
          helperText: aide,
          helperMaxLines: 2,
          errorText: erreur ? '' : null,
          errorStyle: const TextStyle(height: 0, fontSize: 0),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Affiche
        Text('${t.champAffiche} *', style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        InkWell(
          onTap: _enCours ? null : _choisir,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            height: _affiche == null ? 180 : 360,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: _champs.contains('affiche') ? Theme.of(context).colorScheme.error : Couleurs.bordure, width: 2),
            ),
            clipBehavior: Clip.antiAlias,
            child: _affiche == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: const BoxDecoration(color: Couleurs.accent, shape: BoxShape.circle),
                        child: const Icon(Icons.add_photo_alternate_outlined, color: Couleurs.terracotta, size: 30),
                      ),
                      const SizedBox(height: 10),
                      Text(t.choisirAffiche, style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(t.formatsAffiche, style: const TextStyle(color: Couleurs.discret, fontSize: 13)),
                    ],
                  )
                : Stack(
                    fit: StackFit.expand,
                    children: [
                      Padding(padding: const EdgeInsets.all(8), child: Image.memory(_affiche!, fit: BoxFit.contain)),
                      PositionedDirectional(
                        bottom: 10,
                        end: 10,
                        child: FilledButton.tonalIcon(
                          onPressed: _enCours ? null : _choisir,
                          icon: const Icon(Icons.refresh, size: 18),
                          label: Text(t.changerAffiche),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 20),

        TextField(
          controller: _message,
          maxLines: 4,
          maxLength: 1500,
          enabled: !_enCours,
          decoration: deco(t.champMessage).copyWith(hintText: t.aideMessage, alignLabelWithHint: true),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _nom,
          maxLength: 80,
          enabled: !_enCours,
          textCapitalization: TextCapitalization.words,
          autofillHints: const [AutofillHints.name],
          decoration: deco('${t.champNom} *', erreur: _champs.contains('nom')),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _contact,
          maxLength: 120,
          enabled: !_enCours,
          keyboardType: TextInputType.emailAddress,
          textDirection: TextDirection.ltr,
          autofillHints: const [AutofillHints.telephoneNumber, AutofillHints.email],
          inputFormatters: [FilteringTextInputFormatter.deny(RegExp(r'[\n\r]'))],
          decoration: deco('${t.champContact} *', aide: t.aideContact, erreur: _champs.contains('contact')),
        ),
        const SizedBox(height: 12),

        Material(
          color: _champs.contains('consentement') ? Theme.of(context).colorScheme.errorContainer : Couleurs.accent,
          borderRadius: BorderRadius.circular(14),
          child: CheckboxListTile(
            value: _consentement,
            onChanged: _enCours ? null : (v) => setState(() => _consentement = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            activeColor: Couleurs.terracotta,
            title: Text(t.consentement, style: const TextStyle(fontSize: 13, height: 1.35)),
          ),
        ),

        if (_erreur != null) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: Theme.of(context).colorScheme.errorContainer, borderRadius: BorderRadius.circular(12)),
            child: Text(_texteErreur(t, _erreur!),
                style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer, fontWeight: FontWeight.w600)),
          ),
        ],
        const SizedBox(height: 18),
        FilledButton.icon(
          style: FilledButton.styleFrom(
            backgroundColor: Couleurs.terracotta,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(54),
            textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
          ),
          onPressed: _enCours ? null : _envoyer,
          icon: _enCours
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
              : const Icon(Icons.send),
          label: Text(_enCours ? t.envoiEnCours : t.envoyer),
        ),
      ],
    );
  }
}
