"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { exigerStaff } from "@/lib/auth";
import type { EtatFormulaire } from "@/lib/types";

const schemaOrganisateur = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  nom: z.string().trim().min(2, { error: "Le nom est obligatoire." }),
  description: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  email: z.string().trim().email({ error: "E-mail invalide." }).optional().or(z.literal("")),
  lien: z.string().trim().url({ error: "Le lien doit commencer par https://" }).optional().or(z.literal("")),
});

const vide = (v?: string) => (v && v.length > 0 ? v : null);

export async function enregistrerOrganisateur(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  if (!(await exigerStaff())) return { erreur: "Accès refusé." };

  const brut = Object.fromEntries(
    Array.from(formData.entries()).map(([k, v]) => [k, String(v)]),
  );
  const resultat = schemaOrganisateur.safeParse(brut);
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message, champs: brut };
  }
  const d = resultat.data;

  const ligne = {
    nom: d.nom,
    description: vide(d.description),
    telephone: vide(d.telephone),
    email: vide(d.email),
    lien: vide(d.lien),
  };

  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from("organisateur").update(ligne).eq("id", d.id)
    : await supabase.from("organisateur").insert(ligne);

  if (error) return { erreur: `Enregistrement impossible : ${error.message}`, champs: brut };
  revalidateTag("evenements", { expire: 0 });

  redirect("/admin/organisateurs");
}
