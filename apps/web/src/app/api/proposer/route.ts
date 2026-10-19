import { enregistrerProposition, TAILLE_MAX_AFFICHE, type ResultatProposition } from "@/lib/proposition";

/**
 * « Proposer un événement » depuis l'application mobile.
 * Corps multipart : affiche (fichier), nom, contact, message (facultatif), consentement = "on".
 * Réponse JSON : { ok: true } ou { erreur, champs } — mêmes règles que le formulaire du site.
 */

// Appel possible depuis la version web de l'application (tests dans Chrome) : autre origine
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function reponse(r: ResultatProposition, status: number) {
  return Response.json(r, { status, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  // Refus immédiat des envois trop lourds (affiche + champs texte)
  const taille = Number(request.headers.get("content-length") ?? 0);
  if (taille > TAILLE_MAX_AFFICHE + 512 * 1024) return reponse({ erreur: "image", champs: { affiche: true } }, 413);

  let donnees: FormData;
  try {
    donnees = await request.formData();
  } catch {
    return reponse({ erreur: "champs" }, 400);
  }

  const r = await enregistrerProposition(donnees, "application");
  const status = r.ok ? 200 : r.erreur === "trop" ? 429 : r.erreur === "serveur" ? 500 : 400;
  return reponse(r, status);
}
