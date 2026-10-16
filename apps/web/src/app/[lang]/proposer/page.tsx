import type { Metadata } from "next";
import { Gift, MessageCircleQuestion } from "lucide-react";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { BandeauPage } from "@/components/public/bandeau-page";
import { Etoile } from "@/components/public/motifs";
import { FormulaireProposition, type Libelles } from "./formulaire";

export async function generateMetadata(): Promise<Metadata> {
  const l = await langue();
  const d = t(l);
  return {
    title: d.proposer,
    description: d.proposerIntro,
    alternates: { canonical: `/${l}/proposer`, languages: { fr: "/fr/proposer", ar: "/ar/proposer" } },
  };
}

export default async function PageProposer() {
  const l = await langue();
  const d = t(l);
  const libelles: Libelles = {
    champAffiche: d.champAffiche,
    choisirAffiche: d.choisirAffiche,
    formatsAffiche: d.formatsAffiche,
    changerAffiche: d.changerAffiche,
    champMessage: d.champMessage,
    aideMessage: d.aideMessage,
    champNom: d.champNom,
    champContact: d.champContact,
    aideContact: d.aideContact,
    consentement: d.consentement,
    envoyer: d.envoyer,
    envoiEnCours: d.envoiEnCours,
    merciTitre: d.merciTitre,
    merciTexte: d.merciTexte,
    proposerAutre: d.proposerAutre,
    erreurChamps: d.erreurChamps,
    erreurImage: d.erreurImage,
    erreurTrop: d.erreurTrop,
    erreurServeur: d.erreurServeur,
  };

  return (
    <>
      <BandeauPage
        surtitre={d.proposerSurtitre}
        titre={d.proposer}
        teinte="bg-terracotta text-white"
        illustration={
          <span className="flex size-36 -rotate-6 flex-col items-center justify-center rounded-full bg-safran text-center text-encre shadow-xl lg:size-40">
            <Gift className="size-10" strokeWidth={1.75} />
            <span className="mt-1 px-4 font-[family-name:var(--font-titre)] text-base leading-tight font-extrabold">{d.gratuitPourTous}</span>
          </span>
        }
      >
        <p className="max-w-xl text-base opacity-90 sm:text-lg">{d.proposerIntro}</p>
      </BandeauPage>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
        {/* Étapes */}
        <ol className="space-y-5 lg:pt-4">
          {d.etapes.map((etape, i) => (
            <li key={etape} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-encre font-[family-name:var(--font-titre)] text-xl font-extrabold text-safran">
                {i + 1}
              </span>
              <span className="text-lg font-bold leading-snug">{etape}</span>
            </li>
          ))}
          <li className="flex items-start gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
            <MessageCircleQuestion className="mt-0.5 size-5 shrink-0" />
            <span>{d.aideContact}</span>
          </li>
          <li aria-hidden="true" className="hidden justify-center pt-4 text-safran lg:flex">
            <Etoile className="size-8" />
          </li>
        </ol>

        <FormulaireProposition t={libelles} />
      </div>
    </>
  );
}
