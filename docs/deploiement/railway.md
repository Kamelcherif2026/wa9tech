# Déploiement sur Railway — environnement de recette (staging)

Version 1 — 17/10/2026. Objectif : mettre WA9TECH en ligne à une adresse provisoire
(`….up.railway.app`), avec les réglages de la future production. Quand l'association
sera enregistrée, il suffira de créer l'environnement `production` et d'y brancher wa9tech.tn.

## Vue d'ensemble

| Élément | Choix |
|---|---|
| Projet Railway | `wa9tech`, environnements `staging` (maintenant) puis `production` (plus tard) |
| Service | `web` : le site Next.js (public + `/admin`), une seule instance |
| Construction | Railpack (automatique) depuis la racine du dépôt pnpm |
| Base de données | Supabase `wa9tech-dev` partagée avec le local pour l'instant ; un projet `wa9tech-prod` séparé pour la production |
| Déploiement | Automatique à chaque `git push` sur `main`, après le passage au vert de la CI GitHub |
| Indexation Google | Bloquée en recette (`robots.txt` + en-tête `X-Robots-Tag`) |

> Railway annonce la fin des fichiers `railway.json` / `railway.toml` (« Config as Code ») au
> 01/12/2026. Ce guide règle donc tout dans le tableau de bord ; aucun fichier Railway dans le dépôt.

---

## Étape 1 — Créer le projet et l'environnement `staging`

1. Sur [railway.com](https://railway.com), **New Project** → **Empty Project**.
2. **Settings** du projet → nom : `wa9tech`.
3. En haut, le menu des environnements affiche `production` : ouvrez-le → **+ New Environment**
   → nom `staging` → **Empty Environment**. Restez sur `staging` pour toute la suite.

## Étape 2 — Ajouter le service depuis GitHub

1. Dans `staging` : **+ Create** → **GitHub Repo** → `Kamelcherif2026/wa9tech`.
   (Si le dépôt n'apparaît pas : **Configure GitHub App** et autorisez-le.)
2. Railway lance un premier build : **annulez-le** (les variables ne sont pas encore là).
3. Cliquez sur le service → **Settings** → nom : `web`.

## Étape 3 — Variables (onglet **Variables** → **Raw Editor**)

Tapez les valeurs vous-même (ne les collez jamais dans une conversation) :

```
WA9TECH_ENV=staging
NEXT_PUBLIC_SITE_URL=https://A_REMPLIR_ETAPE_5.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://cctnbngkyrydpndbazja.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
OPENROUTER_API_KEY=...
SEL_IP=...
```

- Les mêmes valeurs que votre `.env.local`, sauf `WA9TECH_ENV` et `NEXT_PUBLIC_SITE_URL`.
- `SEL_IP` : vous pouvez reprendre celle du local, ou une nouvelle phrase au hasard.
- Pour `SUPABASE_SECRET_KEY` et `OPENROUTER_API_KEY` : menu **⋮** de la variable → **Seal**
  (la valeur n'est plus jamais affichée, même dans le tableau de bord).
- Les variables `NEXT_PUBLIC_…` sont figées **au moment du build** : après les avoir modifiées,
  il faut redéployer (Railway le propose automatiquement).

## Étape 4 — Réglages du service (onglet **Settings**)

**Source**
- Root Directory : **laisser vide** (le dépôt est un monorepo pnpm : l'installation se fait depuis la racine).
- Branch connected to `staging` : `main`.
- **Wait for CI** : activé (le site n'est déployé que si la CI GitHub est verte).
  Si l'option n'apparaît pas : acceptez d'abord les nouvelles permissions de l'application Railway
  dans GitHub (*Settings → Applications → Railway → Configure*).

**Build**
- Builder : `Railpack` (par défaut).
- Custom Build Command : `pnpm --filter web build`
- Watch Paths (une ligne par motif) :
  ```
  /apps/web/**
  /packages/**
  /pnpm-lock.yaml
  /package.json
  ```
  (Une modification limitée à `supabase/` ou `docs/` ne redéploie pas le site.)

**Deploy**
- Custom Start Command : `pnpm --filter web start`
- Healthcheck Path : `/api/sante`
- Restart Policy : `On Failure`, 10 essais.
- Region : **EU West (Amsterdam)** — la plus proche de Supabase (Francfort) et de la Tunisie.
- Replicas : **1** (le cache du site est en mémoire : une seule instance tant qu'il n'y a pas de cache partagé, cf. ADR 0001).
- Serverless / App Sleeping : **désactivé** (sinon le premier visiteur attend le réveil).

Railway lit Node 22 dans `.nvmrc` / `engines` et pnpm 9.15 dans `packageManager`.

## Étape 5 — Adresse publique

1. **Settings → Networking → Generate Domain**. Si Railway demande un port : laissez-le détecter
   (Next.js écoute la variable `PORT` fournie par Railway).
2. Renommez l'adresse si possible, par ex. `wa9tech-staging.up.railway.app`.
3. Reportez-la dans la variable `NEXT_PUBLIC_SITE_URL` (avec `https://`), puis **Deploy**.

## Étape 6 — Premier déploiement et vérifications

1. **Deployments** → suivez les journaux : *Build* (2 à 4 min) puis *Deploy*, puis le healthcheck.
2. Ouvrez `https://<votre-adresse>/api/sante` → doit afficher
   `{"statut":"ok","environnement":"staging","version":"abc1234"}`.
3. Parcours de recette :
   - [ ] `/` redirige vers `/fr` (ou `/ar` si le navigateur est en arabe)
   - [ ] Accueil FR et AR : à la une, disciplines, carte des villes
   - [ ] Une fiche événement, une page ville, une page catégorie, une page artiste
   - [ ] `/fr/proposer` : envoi d'une affiche → elle apparaît dans **Admin › Soumissions**
   - [ ] `/admin` : connexion, publication d'un événement → visible sur le site en moins d'une minute
   - [ ] `/robots.txt` affiche `Disallow: /` (la recette n'est pas indexée)

## Fonctionnement au quotidien

- `git push` sur `main` → CI GitHub → si verte, Railway reconstruit et remplace le site sans coupure.
- Les **migrations Supabase ne sont pas lancées par Railway** : continuez `npx supabase db push`
  (avant le `git push` si le code dépend d'une nouvelle migration).
- Retour arrière : **Deployments** → déploiement précédent → **⋮ → Redeploy**.

## Dépannage

| Symptôme | Cause probable / solution |
|---|---|
| Build : `Failed to fetch font` | Google Fonts momentanément injoignable : relancez le build. |
| Build : erreur Supabase pendant « Generating static pages » | Variables `NEXT_PUBLIC_SUPABASE_…` absentes ou fausses (le build lit la base). |
| Healthcheck en échec | Voir les *Deploy Logs* ; vérifier la commande de démarrage `pnpm --filter web start`. |
| Le formulaire « Proposer » répond « L'envoi n'a pas abouti » | `SUPABASE_SECRET_KEY` absente ou mal copiée. |
| L'IA ne lit pas les affiches | `OPENROUTER_API_KEY` absente ; voir **Admin › Soumissions** (statut « Erreur »). |
| Changement de `NEXT_PUBLIC_…` sans effet | Ces variables sont intégrées au build : redéployez. |

## Plus tard : production (après l'enregistrement de l'association)

1. Créer le projet Supabase `wa9tech-prod` (région Francfort) et y appliquer les migrations.
2. Dans Railway, environnement `production` : même service `web`, mêmes réglages, variables de production,
   `WA9TECH_ENV=production` et `NEXT_PUBLIC_SITE_URL=https://wa9tech.tn`.
3. **Networking → Custom Domain** : `wa9tech.tn` et `www.wa9tech.tn`, puis les enregistrements DNS
   indiqués par Railway chez le registrar ; `wa9tech.com` en redirection.
4. Déploiement de la production à partir d'étiquettes `vX.Y.Z` (cf. README).
