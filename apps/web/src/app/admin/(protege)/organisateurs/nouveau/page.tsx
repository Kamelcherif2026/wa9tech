import { EntetePage } from "@/components/admin/entete-page";
import { FormulaireOrganisateur } from "../formulaire";

export default function NouvelOrganisateur() {
  return (
    <>
      <EntetePage titre="Nouvel organisateur" />
      <FormulaireOrganisateur />
    </>
  );
}
