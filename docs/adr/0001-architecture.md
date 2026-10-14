# ADR 0001 — Architecture générale

**Date :** 14/10/2026 — **Statut :** accepté

## Décisions
| # | Sujet | Décision |
|---|---|---|
| D1 | Backend | Supabase Cloud (région Europe – Francfort) : PostgreSQL + PostGIS, Auth, Storage, Edge Functions |
| D2 | Hébergement du site | Railway (abonnement existant), environnements `staging` et `production` |
| D3 | Back-office | Intégré au site Next.js (`/admin`) |
| D4 | IA d'extraction des affiches | À choisir après un test sur ~30 affiches réelles (FR/AR/derja) |
| D5 | Cartes | Tuiles OpenStreetMap via fournisseur gratuit (MapTiler / Stadia) |
| D6 | Domaine | wa9tech.tn principal, wa9tech.com en redirection |

## Conséquences
- Une seule base pour le site, l'app et le back-office : la synchronisation est native.
- Les droits d'accès sont appliqués par PostgreSQL (RLS) et testés en CI (pgTAP).
- Next.js tourne sur Railway en une seule instance au départ (cache ISR local cohérent) ; passage à plusieurs instances = prévoir un cache partagé.
