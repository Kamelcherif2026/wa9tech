import { EntetePage } from "@/components/admin/entete-page";
import { ImportAffiche } from "./import-affiche";

export default function PageImporter() {
  return (
    <>
      <EntetePage
        titre="Lire une affiche"
        description="Déposez l'affiche : l'IA pré-remplit la fiche, vous vérifiez puis publiez."
      />
      <ImportAffiche />
    </>
  );
}
