import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Button } from "@/components/ui/button";
import { FormulaireLieu } from "../formulaire";
import { basculerActifLieu } from "../actions";
import type { Lieu, Ville } from "@/lib/types";

export default function ModifierLieu({ params }: PageProps<"/admin/lieux/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/admin/lieux/[id]">["params"] }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: lieu }, { data: villes }] = await Promise.all([
    supabase
      .from("lieu")
      .select("id, slug, ville_id, nom, nom_ar, type, adresse, telephone, lien, lat, lng, actif")
      .eq("id", id)
      .maybeSingle<Lieu>(),
    supabase.from("ville").select("*").order("nom_fr").returns<Ville[]>(),
  ]);
  if (!lieu) notFound();

  return (
    <>
      <EntetePage
        titre={lieu.nom}
        description={lieu.actif ? "Lieu actif" : "Lieu désactivé (masqué du site public)"}
        actions={
          <form action={basculerActifLieu}>
            <input type="hidden" name="id" value={lieu.id} />
            <input type="hidden" name="actif" value={String(lieu.actif)} />
            <Button type="submit" variant={lieu.actif ? "destructive" : "outline"} size="lg">
              {lieu.actif ? "Désactiver" : "Réactiver"}
            </Button>
          </form>
        }
      />
      <FormulaireLieu lieu={lieu} villes={villes ?? []} />
    </>
  );
}
