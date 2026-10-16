"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exigerStaff } from "@/lib/auth";
import { traiterSoumission } from "@/lib/ia/traitement";

export interface EtatImport {
  erreur?: string;
}

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

  const resultat = await traiterSoumission(supabase, { soumissionId: soumission?.id, url, texte, source: "admin" });
  if (!resultat.ok) return { erreur: resultat.erreur };

  const { crees, modele, confiance } = resultat;
  if (crees.length > 1) redirect(`/admin/evenements?statut=en_attente&importes=${crees.length}`);

  const [c] = crees;
  const params = new URLSearchParams({ import: modele, confiance: String(Math.round(confiance * 100)) });
  if (c.alertes.length) params.set("alertes", c.alertes.join(","));
  if (c.doublon) params.set("doublon", c.doublon);
  redirect(`/admin/evenements/${c.id}?${params}`);
}
