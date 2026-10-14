import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RoleStaff = "moderateur" | "admin";

export interface UtilisateurStaff {
  id: string;
  email: string;
  nom: string | null;
  role: RoleStaff;
}

/**
 * Vérifie que l'utilisateur connecté est modérateur ou admin.
 * Redirige vers la connexion sinon ; renvoie null si connecté mais sans droits.
 */
export async function exigerStaff(): Promise<UtilisateurStaff | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/admin/login");

  const { data: profil, error } = await supabase
    .from("profil")
    .select("nom, role")
    .eq("id", claims.sub)
    .single();

  // Une panne réseau ou Supabase ne doit pas se déguiser en « Accès refusé »
  if (error && error.code !== "PGRST116") {
    console.error("[exigerStaff] lecture du profil impossible :", error.code, error.message);
    throw new Error(`Supabase injoignable ou en erreur (${error.code || "réseau"}) : ${error.message}`);
  }

  if (!profil || (profil.role !== "moderateur" && profil.role !== "admin")) {
    console.warn("[exigerStaff] pas de droits staff pour", claims.email, "— rôle :", profil?.role ?? "aucun profil");
    return null;
  }

  return {
    id: claims.sub,
    email: (claims.email as string) ?? "",
    nom: profil.nom,
    role: profil.role,
  };
}
