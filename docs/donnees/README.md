# Référentiels culturels — données sources

Fichiers compilés le 17/10/2026 pour pré-remplir le back-office (migration
`supabase/migrations/20261017000300_referentiels_culturels.sql`). Chaque ligne indique dans
`source` la page qui a servi à la vérifier.

| Fichier | Contenu |
|---|---|
| `lieux_grand_tunis.json` | 96 lieux du Grand Tunis |
| `lieux_regions.json` | 157 lieux des autres gouvernorats (portail culturel du ministère surtout) |
| `organisateurs.json` | 101 festivals, institutions, instituts étrangers, producteurs, associations |
| `artistes_musique.json` | 248 artistes et groupes de musique |
| `artistes_scene.json` | 150 artistes : théâtre, humour, danse, cinéma, arts visuels, lettres |

Limites connues : coordonnées GPS pour environ la moitié des lieux seulement, noms arabes
partiels, peu de cafés culturels et de cinémas en région, liens souvent vers Facebook.
Les corrections se font dans le back-office ; ces fichiers ne sont pas relus après l'import.
