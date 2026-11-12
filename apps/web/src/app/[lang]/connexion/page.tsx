import type { Metadata } from "next";
import { Suspense } from "react";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { BandeauPage } from "@/components/public/bandeau-page";
import { suiteSure } from "@/lib/compte/suite";
import { FormulaireConnexionPublique } from "./formulaire";

// Page propre à chaque visiteur (paramètres de retour) : pas de navigation instantanée
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const d = t(await langue());
  return { title: d.connexionTitre, robots: { index: false } };
}

export default async function PageConnexion({ searchParams }: PageProps<"/[lang]/connexion">) {
  const l = await langue();
  const d = t(l);
  return (
    <>
      <BandeauPage surtitre={d.connexionSurtitre} titre={d.connexionTitre} teinte="bg-encre text-sable">
        <p className="max-w-xl text-base opacity-90 sm:text-lg">{d.connexionIntro}</p>
      </BandeauPage>
      <div className="mx-auto mt-10 max-w-md">
        <Suspense>
          <Contenu searchParams={searchParams} l={l} />
        </Suspense>
      </div>
    </>
  );
}

async function Contenu({ searchParams, l }: { searchParams: PageProps<"/[lang]/connexion">["searchParams"]; l: "fr" | "ar" }) {
  const p = await searchParams;
  const d = t(l);
  const suite = suiteSure(typeof p.suite === "string" ? p.suite : null, `/${l}/espace`);
  return (
    <FormulaireConnexionPublique
      suite={suite}
      erreurInitiale={p.erreur ? d.erreurConnexion : undefined}
      libelles={{
        continuerGoogle: d.continuerGoogle,
        ou: d.ouBien,
        votreEmail: d.votreEmail,
        recevoirLien: d.recevoirLien,
        lienEnvoye: d.lienEnvoye,
        erreurConnexion: d.erreurConnexion,
        emailInvalide: d.emailInvalide,
        conditions: d.conditionsConnexion,
      }}
    />
  );
}
