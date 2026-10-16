"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exigerStaff } from "@/lib/auth";
import { localVersIso } from "@/lib/dates";
import { PORTEES, type EtatFormulaire } from "@/lib/types";

const uuidOuVide = z.string().uuid().optional().or(z.literal(""));
const texte = z.string().trim().optional();
const prix = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v.replace(",", ".")) : null))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), { error: "Prix invalide." });

const schemaEvenement = z.object({
  id: uuidOuVide,
  titre_fr: z.string().trim().min(2, { error: "Le titre est obligatoire." }),
  titre_ar: texte,
  categorie_id: z.coerce.number().int().positive({ error: "Choisissez une catégorie." }),
  lieu_id: uuidOuVide,
  lieu_texte: texte,
  ville_id: z.string().optional(),
  organisateur_id: uuidOuVide,
  description_fr: texte,
  description_ar: texte,
  gratuit: z.string().optional(),
  prix_min: prix,
  prix_max: prix,
  infos_reservation: texte,
  telephone_reservation: texte,
  lien_externe: z.string().trim().url({ error: "Le lien doit commencer par https://" }).optional().or(z.literal("")),
  portee: z.enum(Object.keys(PORTEES) as [keyof typeof PORTEES]),
  images: z.string(),
  representations: z.string(),
  artistes: z.string().optional(),
});

const schemaArtistes = z
  .array(z.object({ id: z.string().uuid().optional(), nom: z.string().trim().min(1).max(120) }))
  .max(30, { error: "30 artistes au maximum." });

const schemaRepresentations = z
  .array(z.object({ debut: z.string().min(16), fin: z.string().optional() }))
  .min(1, { error: "Ajoutez au moins une date." });

/** Le site public est mis en cache : on l'invalide après chaque changement. */
const rafraichirSite = () => revalidateTag("evenements", { expire: 0 });

const vide = (v?: string | null) => (v && v.length > 0 ? v : null);

export async function enregistrerEvenement(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  if (!(await exigerStaff())) return { erreur: "Accès refusé." };

  const brut = Object.fromEntries(
    Array.from(formData.entries()).map(([k, v]) => [k, String(v)]),
  );
  const r = schemaEvenement.safeParse(brut);
  if (!r.success) return { erreur: r.error.issues[0]?.message, champs: brut };
  const d = r.data;

  if (!d.lieu_id && !d.lieu_texte) {
    return { erreur: "Choisissez un lieu, ou saisissez une adresse libre.", champs: brut };
  }
  if (!d.lieu_id && !d.ville_id) {
    return { erreur: "Pour une adresse libre, précisez la ville.", champs: brut };
  }
  if (d.prix_min !== null && d.prix_max !== null && d.prix_max < d.prix_min) {
    return { erreur: "Le prix maximum doit être supérieur au prix minimum.", champs: brut };
  }

  let images: string[];
  let representations: z.infer<typeof schemaRepresentations>;
  let artistes: z.infer<typeof schemaArtistes>;
  try {
    artistes = schemaArtistes.parse(JSON.parse(d.artistes || "[]"));
    images = z.array(z.string().url()).max(5).parse(JSON.parse(d.images));
    representations = schemaRepresentations.parse(
      (JSON.parse(d.representations) as { debut: string; fin?: string }[]).filter((x) => x.debut),
    );
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : "Données invalides.";
    return { erreur: message, champs: brut };
  }

  const ligne = {
    titre_fr: d.titre_fr,
    titre_ar: vide(d.titre_ar),
    categorie_id: d.categorie_id,
    lieu_id: vide(d.lieu_id),
    lieu_texte: d.lieu_id ? null : vide(d.lieu_texte),
    ville_id: d.lieu_id ? null : Number(d.ville_id),
    organisateur_id: vide(d.organisateur_id),
    description_fr: vide(d.description_fr),
    description_ar: vide(d.description_ar),
    gratuit: d.gratuit === "on",
    prix_min: d.gratuit === "on" ? null : d.prix_min,
    prix_max: d.gratuit === "on" ? null : d.prix_max,
    infos_reservation: vide(d.infos_reservation),
    telephone_reservation: vide(d.telephone_reservation),
    lien_externe: vide(d.lien_externe),
    portee: d.portee,
    images,
  };

  const supabase = await createClient();
  let id = d.id || "";

  if (id) {
    const { error } = await supabase.from("evenement").update(ligne).eq("id", id);
    if (error) return { erreur: `Enregistrement impossible : ${error.message}`, champs: brut };
  } else {
    const { data, error } = await supabase
      .from("evenement")
      .insert({ ...ligne, source: "admin", statut: "brouillon" })
      .select("id")
      .single();
    if (error) return { erreur: `Enregistrement impossible : ${error.message}`, champs: brut };
    id = data.id;
  }

  // Représentations : on remplace l'ensemble
  const { error: errSuppr } = await supabase.from("representation").delete().eq("evenement_id", id);
  if (errSuppr) return { erreur: `Dates : ${errSuppr.message}`, champs: brut };
  const { error: errAjout } = await supabase.from("representation").insert(
    representations.map((x) => ({
      evenement_id: id,
      debut: localVersIso(x.debut),
      fin: x.fin ? localVersIso(x.fin) : null,
    })),
  );
  if (errAjout) return { erreur: `Dates : ${errAjout.message}`, champs: brut };

  // Artistes : les nouveaux sont créés (ou retrouvés s'ils existent déjà), puis la liste est remplacée dans l'ordre
  const ids: string[] = [];
  for (const a of artistes) {
    if (a.id) ids.push(a.id);
    else {
      const { data: nouvelId, error: errArtiste } = await supabase.rpc("rapprocher_artiste", { p_nom: a.nom });
      if (errArtiste) return { erreur: `Artiste « ${a.nom} » : ${errArtiste.message}`, champs: brut };
      if (nouvelId) ids.push(nouvelId as string);
    }
  }
  const { error: errArtistes } = await supabase.rpc("definir_artistes", { p_evenement: id, p_artistes: ids });
  if (errArtistes) return { erreur: `Artistes : ${errArtistes.message}`, champs: brut };

  rafraichirSite();
  redirect(`/admin/evenements/${id}?ok=1`);
}

export async function publierEvenement(formData: FormData) {
  if (!(await exigerStaff())) return;
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("publier_evenement", { p_evenement: id });
  rafraichirSite();
  redirect(`/admin/evenements/${id}${error ? `?erreur=${encodeURIComponent(error.message)}` : "?publie=1"}`);
}

export async function rejeterEvenement(formData: FormData) {
  if (!(await exigerStaff())) return;
  const id = String(formData.get("id"));
  const motif = String(formData.get("motif") ?? "").trim() || "Informations insuffisantes";
  const supabase = await createClient();
  await supabase.rpc("rejeter_evenement", { p_evenement: id, p_motif: motif });
  rafraichirSite();
  redirect(`/admin/evenements/${id}`);
}

export async function dupliquerEvenement(formData: FormData) {
  if (!(await exigerStaff())) return;
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dupliquer_evenement", { p_evenement: id });
  if (error) redirect(`/admin/evenements/${id}?erreur=${encodeURIComponent(error.message)}`);
  redirect(`/admin/evenements/${data}?duplique=1`);
}

export async function changerStatut(formData: FormData) {
  if (!(await exigerStaff())) return;
  const id = String(formData.get("id"));
  const statut = String(formData.get("statut"));
  if (!["brouillon", "en_attente", "archive"].includes(statut)) return;
  const supabase = await createClient();
  await supabase.from("evenement").update({ statut }).eq("id", id);
  rafraichirSite();
  redirect(`/admin/evenements/${id}`);
}
