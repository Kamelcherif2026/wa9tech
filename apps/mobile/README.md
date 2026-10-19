# WA9TECH — application mobile (Flutter)

Étape 1 : consultation de l'agenda (accueil, agenda filtrable, fiches, villes, disciplines, lieux, artistes), en français et en arabe.
Données lues directement dans Supabase avec la clé publique (la RLS ne laisse voir que les événements publiés).

## Lancer en développement

```powershell
cd apps\mobile
copy env\staging.example.json env\staging.json   # puis y mettre la clé publishable
flutter run --dart-define-from-file=env/staging.json
```

`env/*.json` n'est pas versionné (sauf l'exemple).

## Prochaines étapes

2. Favoris et rappels (notifications locales), sans compte
3. Carte « autour de moi »
4. Proposer un événement (photo de l'affiche)
