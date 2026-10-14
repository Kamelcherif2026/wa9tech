# Banc d'essai — lecture d'affiches par l'IA

Compare plusieurs modèles (via OpenRouter) sur les affiches de `../affiches_test`
et mesure : titre, date, heure, lieu, ville, catégorie, prix, téléphone, coût et rapidité.

- `verite.json` : les bonnes réponses attendues pour chaque affiche.
- `prompt.mjs` : la consigne et le schéma JSON (repris en production).
- `benchmark.mjs` : le script.

```powershell
node scripts/benchmark-ia/benchmark.mjs --lister            # modèles retenus + coût estimé
node scripts/benchmark-ia/benchmark.mjs --oui --limite 5    # essai rapide
node scripts/benchmark-ia/benchmark.mjs --oui               # test complet
```

Résultats : `scripts/benchmark-ia/resultats/<date>/rapport.md` (non versionné).
