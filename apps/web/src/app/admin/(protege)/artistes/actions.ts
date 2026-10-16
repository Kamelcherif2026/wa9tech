"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exigerStaff } from "@/lib/auth";
import type { EtatFormulaire } from "@/lib/types";

export interface ArtisteTrouve {
  id: string;
  slug: string;
  nom: string;
  nom_ar: string | null;
  nb_evenements: number;
}

/** Suggestions du sélecteur d'artistes (FR ou AR, recherche approximative). */
export async function chercherArtistes(q: string): Promise<ArtisteTrouve[]> {
  if (!(await exigerStaff())) return [];
  const terme = q.trim().slice(0, 80);
  if (terme.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("rechercher_artistes", { p_q: terme, p_limite: 8 });
  return (data ?? []) as ArtisteTrouve[];
}

const schemaArtiste = z.object({
  id: z.string().uuid(),
  nom: z.string().trim().min(2, { error: "Le nom est obligatoire." }).max(120),
  nom_ar: z.string().trim().max(120).optional(),
  lien: z.string().trim().url({ error: "Le lien doit commencer par https://" }).optional().or(z.literal("")),
});

export async function enregistrerArtiste(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await exigerStaff())) return { erreur: "Accès refusé." };
  const brut = Object.fromEntries(Array.from(formData.entries()).map(([k, v]) => [k, String(v)]));
  const r = schemaArtiste.safeParse(brut);
  if (!r.success) return { erreur: r.error.issues[0]?.message, champs: brut };
  const { id, nom, nom_ar, lien } = r.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("artiste")
    .update({ nom, nom_ar: nom_ar || null, lien: lien || null })
    .eq("id", id);
  if (error) return { erreur: `Enregistrement impossible : ${error.message}`, champs: brut };

  revalidateTag("evenements", { expire: 0 });
  redirect(`/admin/artistes/${id}?ok=1`);
}

/** Fusionne un doublon dans l'artiste conservé, puis supprime le doublon. */
export async function fusionnerArtiste(formData: FormData) {
  if (!(await exigerStaff())) return;
  const doublon = String(formData.get("id"));
  const garde = String(formData.get("garde"));
  if (!garde || garde === doublon) redirect(`/admin/artistes/${doublon}?erreur=${encodeURIComponent("Choisissez l'artiste à conserver.")}`);

  const supabase = await createClient();
  const { data: liens } = await supabase.from("evenement_artiste").select("evenement_id, ordre").eq("artiste_id", doublon);
  for (const l of liens ?? []) {
    await supabase
      .from("evenement_artiste")
      .upsert({ evenement_id: l.evenement_id, artiste_id: garde, ordre: l.ordre }, { onConflict: "evenement_id,artiste_id", ignoreDuplicates: true });
  }
  const { error } = await supabase.from("artiste").delete().eq("id", doublon);
  if (error) redirect(`/admin/artistes/${doublon}?erreur=${encodeURIComponent(error.message)}`);
  revalidateTag("evenements", { expire: 0 });
  redirect(`/admin/artistes/${garde}?fusion=1`);
}

export async function supprimerArtiste(formData: FormData) {
  if (!(await exigerStaff())) return;
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("artiste").delete().eq("id", id);
  if (error) redirect(`/admin/artistes/${id}?erreur=${encodeURIComponent(error.message)}`);
  revalidateTag("evenements", { expire: 0 });
  redirect("/admin/artistes?supprime=1");
}
