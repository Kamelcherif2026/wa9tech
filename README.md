# WA9TECH (وقتاش)

Agenda culturel de la Tunisie — site web, application mobile et back-office.
Porté par l'Association tunisienne pour l'innovation culturelle.

## Stack

| Couche | Techno |
|---|---|
| Base / Auth / Storage / fonctions | Supabase (PostgreSQL + PostGIS, pg_trgm, pg_cron, RLS) |
| Site + back-office | Next.js (App Router, TypeScript, Tailwind, shadcn/ui, next-intl) — hébergé sur Railway |
| App mobile (Phase 2) | Flutter |
| Push / e-mails | Firebase Cloud Messaging / Brevo |

Documentation : décisions techniques dans `docs/adr/`, modèle de variables d'environnement dans `docs/env/`.

## Structure

```
apps/web/            Next.js : site public + /admin
apps/mobile/         Flutter (Phase 2)
packages/shared/     Schémas Zod, constantes, types générés
supabase/migrations/ Schéma SQL versionné
supabase/functions/  Edge Functions (Deno)
supabase/tests/      Tests pgTAP (règles métier + RLS)
supabase/seed.sql    Villes et catégories
```

## Démarrage (Sprint 0)

Prérequis : Node 22, pnpm, Docker Desktop, [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
# 1. Initialiser la config Supabase (crée supabase/config.toml, ne touche pas aux migrations)
supabase init

# 2. Démarrer Supabase en local (Docker) — applique migrations + seed
supabase start

# 3. Vérifier la base : 24 tests pgTAP (règles métier + RLS)
supabase test db

# 4. Générer les types TypeScript partagés
supabase gen types typescript --local > packages/shared/database.types.ts
```

Studio local : http://localhost:54323

### Créer l'application web

```bash
cd apps
pnpm create next-app@latest web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
cd web
pnpm add @supabase/supabase-js @supabase/ssr next-intl zod react-hook-form @hookform/resolvers
pnpm dlx shadcn@latest init
cp ../../docs/env/web.env.example .env.local   # puis renseigner les clés affichées par `supabase status`
```

### Lier le projet Supabase distant

```bash
supabase link --project-ref <ref-du-projet>
supabase db push          # applique les migrations en recette / production
```

## Conventions

- Toute modification de la base passe par une **migration** (`supabase migration new <nom>`), jamais par le Studio en production.
- Chaque nouvelle table : **RLS activée + policies + test pgTAP**.
- Les clés `service_role` ne sortent jamais du serveur (Edge Functions, routes serveur Next.js).
- Branches : `main` (déployée en recette), tags `vX.Y.Z` (production).
