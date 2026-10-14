"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exigerStaff } from "@/lib/auth";
import { extraireCoordonnees, versEwkt } from "@/lib/geo";
import { TYPES_LIEU, type EtatFormulaire } from "@/lib/types";

const schemaLieu = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  nom: z.string().trim().min(2, { error: "Le nom est obligatoire." }),
  nom_ar: z.string().trim().optional(),
  type: z.enum(Object.keys(TYPES_LIEU) as [keyof typeof TYPES_LIEU], {
    error: "Choisissez un type de lieu.",
  }),
  ville_id: z.coerce.number().int().positive({ error: "Choisissez une ville." }),
  adresse: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  lien: z.string().trim().url({ error: "Le lien doit commencer par https://" }).optional().or(z.literal("")),
  gps: z.string().trim().optional(),
});

const vide = (v?: string) => (v && v.length > 0 ? v : null);

export async function enregistrerLieu(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  if (!(await exigerStaff())) return { erreur: "Accès refusé." };

  const brut = Object.fromEntries(
    Array.from(formData.entries()).map(([k, v]) => [k, String(v)]),
  );
  const resultat = schemaLieu.safeParse(brut);
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message, champs: brut };
  }
  const d = resultat.data;

  let position: string | null = null;
  if (d.gps) {
    const coords = extraireCoordonnees(d.gps);
    if (!coords) {
      return {
        erreur: "Coordonnées GPS non reconnues (collez un lien Google Maps ou « 36.80, 10.18 »).",
        champs: brut,
      };
    }
    position = versEwkt(coords.lat, coords.lng);
  }

  const ligne = {
    nom: d.nom,
    nom_ar: vide(d.nom_ar),
    type: d.type,
    ville_id: d.ville_id,
    adresse: vide(d.adresse),
    telephone: vide(d.telephone),
    lien: vide(d.lien),
    position,
  };

  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from("lieu").update(ligne).eq("id", d.id)
    : await supabase.from("lieu").insert(ligne);

  if (error) return { erreur: `Enregistrement impossible : ${error.message}`, champs: brut };

  redirect("/admin/lieux");
}

export async function basculerActifLieu(formData: FormData) {
  if (!(await exigerStaff())) return;
  const id = String(formData.get("id"));
  const actif = formData.get("actif") === "true";
  const supabase = await createClient();
  await supabase.from("lieu").update({ actif: !actif }).eq("id", id);
  redirect(`/admin/lieux/${id}`);
}
