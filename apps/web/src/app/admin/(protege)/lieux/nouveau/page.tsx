import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { FormulaireLieu } from "../formulaire";
import type { Ville } from "@/lib/types";

export default function NouveauLieu() {
  return (
    <>
      <EntetePage titre="Nouveau lieu" />
      <Suspense fallback={<Chargement />}>
        <Contenu />
      </Suspense>
    </>
  );
}

async function Contenu() {
  const supabase = await createClient();
  const { data: villes } = await supabase.from("ville").select("*").order("nom_fr").returns<Ville[]>();
  return <FormulaireLieu villes={villes ?? []} />;
}
