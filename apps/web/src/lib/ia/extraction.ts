import { z } from "zod";
import { CONSIGNE, SCHEMA } from "./consigne";

/** Modèles choisis après le banc d'essai du 14/10/2026 (score 97,3 et 98,2). */
const MODELES = [
  process.env.IA_MODELE_PRINCIPAL ?? "anthropic/claude-haiku-5.5",
  process.env.IA_MODELE_SECOURS ?? "google/gemini-3.5-flash-lite",
];

const representation = z.object({
  date: z.string().nullable().catch(null),
  date_fin: z.string().nullable().catch(null),
  heure: z.string().nullable().catch(null),
});

const evenementLu = z.object({
  titre: z.string().catch(""),
  titre_ar: z.string().nullable().catch(null),
  artistes: z.array(z.string()).catch([]),
  categorie: z.string().catch("musique"),
  representations: z.array(representation).catch([]),
  annee_explicite: z.boolean().catch(true),
  lieu_nom: z.string().nullable().catch(null),
  ville: z.string().nullable().catch(null),
  adresse: z.string().nullable().catch(null),
  en_tunisie: z.boolean().nullable().catch(null),
  gratuit: z.boolean().nullable().catch(null),
  prix_min: z.number().nullable().catch(null),
  prix_max: z.number().nullable().catch(null),
  telephones: z.array(z.string()).catch([]),
  lien: z.string().nullable().catch(null),
  description_courte: z.string().nullable().catch(null),
  confiance: z.number().catch(0.5),
});

const extractionLue = z.object({
  est_une_affiche_evenement: z.boolean(),
  evenements: z.array(evenementLu),
});

export type EvenementLu = z.infer<typeof evenementLu>;
export type Extraction = z.infer<typeof extractionLue>;

const dateDuJour = () =>
  new Intl.DateTimeFormat("fr-CA", { timeZone: "Africa/Tunis" }).format(new Date());

const API = process.env.OPENROUTER_BASE ?? "https://openrouter.ai/api/v1";

async function appeler(modele: string, urlImage: string, texte?: string, formatStrict = true): Promise<Extraction> {
  const cle = process.env.OPENROUTER_API_KEY;
  if (!cle) throw new Error("OPENROUTER_API_KEY manquante dans .env.local");
  const consigneUtilisateur =
    `Date du jour : ${dateDuJour()}. Analyse cette affiche.${texte ? `\nTexte joint : ${texte}` : ""}` +
    (formatStrict ? "" : `\nRéponds avec un JSON conforme à ce schéma : ${JSON.stringify(SCHEMA)}`);

  const reponse = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://wa9tech.tn",
      "X-Title": "WA9TECH",
    },
    body: JSON.stringify({
      model: modele,
      temperature: 0,
      max_tokens: 4000,
      messages: [
        { role: "system", content: CONSIGNE },
        {
          role: "user",
          content: [
            { type: "text", text: consigneUtilisateur },
            { type: "image_url", image_url: { url: urlImage } },
          ],
        },
      ],
      response_format: formatStrict
        ? { type: "json_schema", json_schema: { name: "extraction_affiche", strict: true, schema: SCHEMA } }
        : { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (reponse.status === 400 && formatStrict) return appeler(modele, urlImage, texte, false);
  if (!reponse.ok) throw new Error(`${modele} : HTTP ${reponse.status}`);

  const donnees = await reponse.json();
  const contenu: string = donnees.choices?.[0]?.message?.content ?? "";
  const json = JSON.parse(contenu.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());
  return extractionLue.parse(json);
}

/** Lit une affiche : modèle principal, puis modèle de secours en cas d'échec. */
export async function lireAffiche(urlImage: string, texte?: string) {
  const erreurs: string[] = [];
  for (const modele of MODELES) {
    try {
      const extraction = await appeler(modele, urlImage, texte);
      return { extraction, modele };
    } catch (e) {
      erreurs.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`Lecture impossible — ${erreurs.join(" ; ")}`);
}
