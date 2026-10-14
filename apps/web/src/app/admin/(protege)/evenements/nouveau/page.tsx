import { Suspense } from "react";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { FormulaireEvenement } from "../formulaire";
import { chargerOptions } from "../donnees";

export default function NouvelEvenement() {
  return (
    <>
      <EntetePage titre="Nouvel événement" description="Enregistré en brouillon ; publiez-le ensuite depuis sa fiche." />
      <Suspense fallback={<Chargement />}>
        <Contenu />
      </Suspense>
    </>
  );
}

async function Contenu() {
  const options = await chargerOptions();
  return <FormulaireEvenement {...options} />;
}
