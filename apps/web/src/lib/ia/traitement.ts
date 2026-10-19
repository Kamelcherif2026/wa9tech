import type { SupabaseClient } from "@supabase/supabase-js";
import { lireAffiche, type EvenementLu } from "./extraction";
import { composerLieuTexte } from "./lieu";

/**
 * Chaîne commune « affiche → fiches en attente », utilisée par :
 *  - l'import du back-office (client du modérateur connecté),
 *  - le formulaire public « Proposer un événement » (client service, après la réponse).
 * Les fiches créées ont toujours le statut « en_attente » : un humain valide avant publication.
 */

type Source = "admin" | "formulaire" | "application" | "whatsapp" | "email" | "ambassadeur" | "organisateur";

export interface FicheCreee {
  id: string;
  alertes: string[];
  doublon?: string;
}

export type ResultatTraitement =
  | { ok: true; crees: FicheCreee[]; modele: string; confiance: number }
  | { ok: false; erreur: string };

const HEURE_PAR_DEFAUT = "20:00";
const estDate = (d: string | null): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
const estHeure = (h: string | null): h is string => !!h && /^\d{2}:\d{2}/.test(h);

export async function traiterSoumission(
  supabase: SupabaseClient,
  { soumissionId, url, texte, source }: { soumissionId?: string; url: string; texte?: string; source: Source },
): Promise<ResultatTraitement> {
  const majSoumission = async (champs: Record<string, unknown>) => {
    if (soumissionId) await supabase.from("soumission").update(champs).eq("id", soumissionId);
  };

  // 1. Lecture par l'IA
  let lecture: Awaited<ReturnType<typeof lireAffiche>>;
  try {
    lecture = await lireAffiche(url, texte);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await majSoumission({ statut: "erreur", erreur: message });
    return { ok: false, erreur: message };
  }
  const { extraction, modele } = lecture;

  if (!extraction.est_une_affiche_evenement || extraction.evenements.length === 0) {
    await majSoumission({ statut: "rejetee", extraction_ia: { ...extraction, modele }, erreur: "Aucun événement détecté" });
    return { ok: false, erreur: "L'IA n'a détecté aucun événement sur cette image." };
  }

  // 2. Création des fiches (une par événement détecté)
  const { data: categories } = await supabase.from("categorie").select("id, slug");
  const idCategorie = (slug: string) =>
    categories?.find((c) => c.slug === slug)?.id ?? categories?.find((c) => c.slug === "musique")?.id;

  const crees: FicheCreee[] = [];
  for (const e of extraction.evenements) {
    const resultat = await creerFiche(supabase, e, url, idCategorie(e.categorie), source);
    if (resultat) crees.push(resultat);
  }

  const confiance = Math.min(...extraction.evenements.map((e) => e.confiance));
  await majSoumission({
    statut: crees.length ? "extraite" : "erreur",
    extraction_ia: { ...extraction, modele },
    confiance_ia: confiance,
    evenement_id: crees[0]?.id ?? null,
    doublon_de: crees[0]?.doublon ?? null,
    erreur: crees.length ? null : "Création de la fiche impossible",
  });

  if (crees.length === 0) return { ok: false, erreur: "Impossible de créer la fiche (voir la console du serveur)." };
  return { ok: true, crees, modele, confiance };
}

async function creerFiche(
  supabase: SupabaseClient,
  e: EvenementLu,
  urlImage: string,
  categorieId: number | undefined,
  source: Source,
): Promise<FicheCreee | null> {
  const alertes: string[] = [];

  const { data: villeId } = e.ville ? await supabase.rpc("rapprocher_ville", { p_nom: e.ville }) : { data: null };
  // Lieu de la base : d'abord le nom lu, sinon le texte complet (nom + adresse).
  // La fonction SQL ne rattache que si la correspondance est sûre (sinon alerte « lieu »).
  let lieu: { id: string } | undefined;
  for (const texte of new Set([e.lieu_nom, composerLieuTexte(e.lieu_nom, e.adresse)])) {
    if (!texte || lieu) continue;
    const { data } = await supabase.rpc("rapprocher_lieu", { p_nom: texte, p_ville_id: villeId });
    lieu = (data as { id: string }[] | null)?.[0];
  }

  if (!lieu) alertes.push("lieu");
  if (e.en_tunisie === false) alertes.push("hors_tunisie");
  if (!e.annee_explicite) alertes.push("annee");
  if (e.confiance < 0.6) alertes.push("confiance");

  const reps = e.representations.filter((r) => estDate(r.date));
  if (reps.length === 0) alertes.push("date");
  if (reps.some((r) => !estHeure(r.heure))) alertes.push("heure");

  // Doublon éventuel (même jour, titre proche), cherché avant la création
  let doublon: string | undefined;
  if (reps.length) {
    const { data } = await supabase.rpc("chercher_doublon", {
      p_titre: e.titre,
      p_dates: reps.map((r) => r.date),
    });
    doublon = (data as { id: string }[] | null)?.[0]?.id;
  }

  const description = e.description_courte ?? "";

  const { data: evt, error } = await supabase
    .from("evenement")
    .insert({
      titre_fr: e.titre || "Titre à compléter",
      titre_ar: e.titre_ar,
      categorie_id: categorieId,
      lieu_id: lieu?.id ?? null,
      lieu_texte: lieu ? null : composerLieuTexte(e.lieu_nom, e.adresse),
      ville_id: lieu ? null : villeId,
      description_fr: description || null,
      images: [urlImage],
      gratuit: e.gratuit === true,
      prix_min: e.gratuit ? null : e.prix_min,
      prix_max: e.gratuit ? null : (e.prix_max ?? e.prix_min),
      telephone_reservation: e.telephones[0] ?? null,
      lien_externe: e.lien?.startsWith("http") ? e.lien : null,
      source,
      statut: "en_attente",
    })
    .select("id")
    .single();
  if (error || !evt) {
    console.error("Import affiche :", error?.message);
    return null;
  }

  // Artistes lus sur l'affiche : retrouvés ou créés, dans l'ordre de l'affiche (8 au maximum)
  const ids: string[] = [];
  for (const nom of e.artistes.slice(0, 8)) {
    const { data } = await supabase.rpc("rapprocher_artiste", { p_nom: nom });
    if (data && !ids.includes(data as string)) ids.push(data as string);
  }
  if (ids.length) {
    const { error: errArt } = await supabase.rpc("definir_artistes", { p_evenement: evt.id, p_artistes: ids });
    if (errArt) console.error("Import affiche, artistes :", errArt.message);
  }

  if (reps.length) {
    await supabase.from("representation").insert(
      reps.map((r) => ({
        evenement_id: evt.id,
        debut: `${r.date}T${estHeure(r.heure) ? r.heure.slice(0, 5) : HEURE_PAR_DEFAUT}:00+01:00`,
        fin: estDate(r.date_fin) ? `${r.date_fin}T23:59:00+01:00` : null,
      })),
    );
  }

  return { id: evt.id as string, alertes, doublon };
}
