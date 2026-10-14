import { createClient } from "@/lib/supabase/server";
import type { Categorie, Ville } from "@/lib/types";
import type { OptionLieu, OptionOrganisateur } from "./formulaire";

/** Listes nécessaires au formulaire d'événement. */
export async function chargerOptions() {
  const supabase = await createClient();
  const [categories, lieux, organisateurs, villes] = await Promise.all([
    supabase.from("categorie").select("id, slug, parent_id, libelle_fr, libelle_ar, ordre").order("ordre").returns<Categorie[]>(),
    supabase.from("lieu").select("id, nom, ville:ville_id(nom_fr)").eq("actif", true).order("nom")
      .returns<{ id: string; nom: string; ville: { nom_fr: string } | null }[]>(),
    supabase.from("organisateur").select("id, nom").order("nom").returns<OptionOrganisateur[]>(),
    supabase.from("ville").select("*").order("nom_fr").returns<Ville[]>(),
  ]);
  return {
    categories: categories.data ?? [],
    lieux: (lieux.data ?? []).map<OptionLieu>((l) => ({ id: l.id, nom: l.nom, ville: l.ville?.nom_fr ?? "" })),
    organisateurs: organisateurs.data ?? [],
    villes: villes.data ?? [],
  };
}
