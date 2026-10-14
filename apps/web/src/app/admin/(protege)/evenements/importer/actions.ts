"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exigerStaff } from "@/lib/auth";
import { lireAffiche, type EvenementLu } from "@/lib/ia/extraction";
import { composerLieuTexte } from "@/lib/ia/lieu";

export interface EtatImport {
  erreur?: string;
}

const HEURE_PAR_DEFAUT = "20:00";
const estDate = (d: string | null): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
const estHeure = (h: string | null): h is string => !!h && /^\d{2}:\d{2}/.test(h);

export async function importerAffiche(_etat: EtatImport, formData: FormData): Promise<EtatImport> {
  if (!(await exigerStaff())) return { erreur: "Accès refusé." };

  const url = String(formData.get("url") ?? "");
  const texte = String(formData.get("texte") ?? "").trim() || undefined;
  if (!url.startsWith("https://")) return { erreur: "Image manquante." };

  const supabase = await createClient();
  const { data: soumission } = await supabase
    .from("soumission")
    .insert({ canal: "admin", images: [url], texte_brut: texte ?? null, statut: "recue" })
    .select("id")
    .single();

  // 1. Lecture par l'IA
  let lecture: Awaited<ReturnType<typeof lireAffiche>>;
  try {
    lecture = await lireAffiche(url, texte);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (soumission) await supabase.from("soumission").update({ statut: "erreur", erreur: message }).eq("id", soumission.id);
    return { erreur: message };
  }
  const { extraction, modele } = lecture;

  if (!extraction.est_une_affiche_evenement || extraction.evenements.length === 0) {
    if (soumission) {
      await supabase.from("soumission")
        .update({ statut: "rejetee", extraction_ia: extraction, erreur: "Aucun événement détecté" })
        .eq("id", soumission.id);
    }
    return { erreur: "L'IA n'a détecté aucun événement sur cette image." };
  }

  // 2. Création des fiches (une par événement détecté)
  const { data: categories } = await supabase.from("categorie").select("id, slug");
  const idCategorie = (slug: string) =>
    categories?.find((c) => c.slug === slug)?.id ?? categories?.find((c) => c.slug === "musique")?.id;

  const crees: { id: string; alertes: string[]; doublon?: string }[] = [];
  for (const e of extraction.evenements) {
    const resultat = await creerFiche(supabase, e, url, idCategorie(e.categorie));
    if (resultat) crees.push(resultat);
  }

  if (soumission) {
    await supabase.from("soumission").update({
      statut: crees.length ? "extraite" : "erreur",
      extraction_ia: { ...extraction, modele },
      confiance_ia: Math.min(...extraction.evenements.map((e) => e.confiance)),
      evenement_id: crees[0]?.id ?? null,
      doublon_de: crees[0]?.doublon ?? null,
    }).eq("id", soumission.id);
  }

  if (crees.length === 0) return { erreur: "Impossible de créer la fiche (voir la console du serveur)." };
  if (crees.length > 1) redirect(`/admin/evenements?statut=en_attente&importes=${crees.length}`);

  const [c] = crees;
  const params = new URLSearchParams({ import: modele, confiance: String(Math.round(extraction.evenements[0].confiance * 100)) });
  if (c.alertes.length) params.set("alertes", c.alertes.join(","));
  if (c.doublon) params.set("doublon", c.doublon);
  redirect(`/admin/evenements/${c.id}?${params}`);
}

async function creerFiche(
  supabase: Awaited<ReturnType<typeof createClient>>,
  e: EvenementLu,
  urlImage: string,
  categorieId: number | undefined,
) {
  const alertes: string[] = [];

  const { data: villeId } = e.ville ? await supabase.rpc("rapprocher_ville", { p_nom: e.ville }) : { data: null };
  const { data: lieux } = e.lieu_nom
    ? await supabase.rpc("rapprocher_lieu", { p_nom: e.lieu_nom, p_ville_id: villeId })
    : { data: null };
  const lieu = (lieux as { id: string }[] | null)?.[0];

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

  const description = [e.description_courte, e.artistes.length ? `Avec : ${e.artistes.join(", ")}.` : null]
    .filter(Boolean)
    .join("\n\n");

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
      source: "admin",
      statut: "en_attente",
    })
    .select("id")
    .single();
  if (error || !evt) {
    console.error("Import affiche :", error?.message);
    return null;
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
