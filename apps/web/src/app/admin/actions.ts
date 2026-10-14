"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EtatFormulaire } from "@/lib/types";

export async function seConnecter(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const suite = String(formData.get("suite") ?? "/admin");

  if (!email || !motDePasse) {
    return { erreur: "Saisissez votre e-mail et votre mot de passe.", champs: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

  if (error) {
    return { erreur: "E-mail ou mot de passe incorrect.", champs: { email } };
  }

  redirect(suite.startsWith("/admin") ? suite : "/admin");
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
