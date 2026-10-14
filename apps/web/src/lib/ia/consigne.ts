// =====================================================================
// WA9TECH — Consigne et schéma d'extraction des affiches
// Copie de scripts/benchmark-ia/prompt.mjs : toute modification doit être reportée
// dans les deux fichiers, puis revalidée avec le banc d'essai.
// =====================================================================

export const CATEGORIES: Record<string, string[]> = {
  musique: ["concert", "live", "scene-ouverte", "dj-set", "musique-traditionnelle"],
  theatre: ["piece-theatre", "humour", "theatre-de-rue"],
  cinema: ["film-a-l-affiche", "film-tunisien", "cine-club", "projection-debat"],
  "arts-visuels": ["exposition", "vernissage", "street-art", "photographie"],
  danse: ["spectacle-danse", "soiree-danse"],
  festivals: ["festival", "festival-independant"],
  rencontres: ["conference", "lecture", "debat"],
  ateliers: ["atelier", "masterclass", "residence-ouverte"],
  patrimoine: ["visite", "fete-traditionnelle", "journees-patrimoine"],
  "jeune-public": ["spectacle-enfant", "atelier-enfant"],
};

export const SLUGS_CATEGORIES = Object.entries(CATEGORIES).flatMap(([p, enfants]) => [p, ...enfants]);

/** Catégorie parente d'un slug (ex. « humour » → « theatre »). */
export function parentCategorie(slug: string | null | undefined): string | null {
  if (!slug) return null;
  if (CATEGORIES[slug]) return slug;
  return Object.keys(CATEGORIES).find((p) => CATEGORIES[p].includes(slug)) ?? null;
}

export const CONSIGNE = `Tu es l'assistant d'extraction de WA9TECH, l'agenda culturel de la Tunisie.
On te donne l'image d'une affiche (et parfois un court texte). Tu renvoies UNIQUEMENT un objet JSON conforme au schéma.

Règles :
1. N'invente jamais rien. Une information absente ou illisible vaut null (ou une liste vide).
2. est_une_affiche_evenement = false si l'image n'annonce aucun événement culturel daté (publicité, logo, photo…).
3. Si l'affiche annonce plusieurs événements distincts (programme de la semaine, plusieurs spectacles), crée un objet par événement.
4. titre : le nom du spectacle ou de l'événement — jamais le nom de la salle, du sponsor ou de la billetterie.
   Si le titre n'existe qu'en arabe, donne sa translittération française usuelle dans « titre » et l'original dans « titre_ar ».
5. Dates au format AAAA-MM-JJ. Une entrée dans « representations » par date de représentation.
   Pour une période continue (festival, exposition), une seule entrée avec « date » (début) et « date_fin ».
   Si l'année n'est pas écrite, choisis la prochaine occurrence à partir de la date du jour fournie et mets annee_explicite = false.
6. Heures au format HH:MM sur 24 h (« 19h30 » → « 19:30 », « التاسعة ليلا » → « 21:00 », « 7:30 PM » → « 19:30 »).
   Si plusieurs heures se contredisent, prends celle qui est la plus mise en évidence.
7. lieu_nom : la salle ou le lieu précis (ex. « Théâtre municipal de Tunis », « Cité de la Culture – Théâtre des Régions »).
   ville : la ville en français (ex. « Tunis », « Sousse », « Djerba »). en_tunisie = false si le lieu est hors de Tunisie.
8. Prix en dinars tunisiens : prix_min / prix_max (nombres). gratuit = true uniquement si c'est écrit (gratuit, entrée libre, مجاني).
9. telephones : numéros de réservation, chiffres uniquement, sans l'indicatif +216.
10. categorie : la valeur la plus précise de la liste autorisée (ex. « humour » pour un stand-up, « spectacle-enfant » pour un spectacle jeune public).
11. Ignore les logos, sponsors, médias et billetteries (Teskerti, Tunis.Event…), sauf pour le champ « lien ».
12. confiance : ta confiance globale entre 0 et 1.`;

const texteOuNull = { type: ["string", "null"] };
const nombreOuNull = { type: ["number", "null"] };

export const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["est_une_affiche_evenement", "evenements"],
  properties: {
    est_une_affiche_evenement: { type: "boolean" },
    evenements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "titre", "titre_ar", "artistes", "categorie", "representations", "annee_explicite",
          "lieu_nom", "ville", "adresse", "en_tunisie", "gratuit", "prix_min", "prix_max",
          "telephones", "lien", "description_courte", "confiance",
        ],
        properties: {
          titre: { type: "string" },
          titre_ar: texteOuNull,
          artistes: { type: "array", items: { type: "string" } },
          categorie: { type: "string", enum: SLUGS_CATEGORIES },
          representations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["date", "date_fin", "heure"],
              properties: { date: texteOuNull, date_fin: texteOuNull, heure: texteOuNull },
            },
          },
          annee_explicite: { type: "boolean" },
          lieu_nom: texteOuNull,
          ville: texteOuNull,
          adresse: texteOuNull,
          en_tunisie: { type: ["boolean", "null"] },
          gratuit: { type: ["boolean", "null"] },
          prix_min: nombreOuNull,
          prix_max: nombreOuNull,
          telephones: { type: "array", items: { type: "string" } },
          lien: texteOuNull,
          description_courte: texteOuNull,
          confiance: { type: "number" },
        },
      },
    },
  },
};
