import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { FormulaireOrganisateur } from "../formulaire";
import type { Organisateur } from "@/lib/types";

export default function ModifierOrganisateur({ params }: PageProps<"/admin/organisateurs/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/admin/organisateurs/[id]">["params"] }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisateur")
    .select("*")
    .eq("id", id)
    .maybeSingle<Organisateur>();
  if (!data) notFound();

  return (
    <>
      <EntetePage titre={data.nom} />
      <FormulaireOrganisateur organisateur={data} />
    </>
  );
}
