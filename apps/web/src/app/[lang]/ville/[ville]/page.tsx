import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { langue } from "@/lib/public/langue";
import { referentiels } from "@/lib/public/requetes";
import { t } from "@/lib/i18n";
import { ChargementResultats, lireCriteres, Resultats } from "@/components/public/resultats";
import { BandeauPage } from "@/components/public/bandeau-page";
import { MiniCarte } from "@/components/public/mini-carte";

export async function generateStaticParams() {
  const { villes } = await referentiels();
  // Au moins une valeur est exigée par Next.js (même si la base est injoignable pendant le build)
  return villes.length ? villes.map((v) => ({ ville: v.slug })) : [{ ville: "tunis" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/ville/[ville]">): Promise<Metadata> {
  const [{ ville }, l, { villes }] = await Promise.all([params, langue(), referentiels()]);
  const v = villes.find((x) => x.slug === ville);
  if (!v) return {};
  const nom = l === "ar" ? v.nom_ar : v.nom_fr;
  return {
    title: t(l).agendaDe(nom),
    alternates: { canonical: `/${l}/ville/${ville}`, languages: { fr: `/fr/ville/${ville}`, ar: `/ar/ville/${ville}` } },
  };
}

export default function PageVille({ params, searchParams }: PageProps<"/[lang]/ville/[ville]">) {
  return (
    <Suspense fallback={<ChargementResultats />}>
      <Entete params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Entete({ params, searchParams }: { params: PageProps<"/[lang]/ville/[ville]">["params"]; searchParams: PageProps<"/[lang]/ville/[ville]">["searchParams"] }) {
  const [{ ville }, l, { villes }] = await Promise.all([params, langue(), referentiels()]);
  const v = villes.find((x) => x.slug === ville);
  if (!v) notFound();
  const d = t(l);
  return (
    <>
      <BandeauPage
        surtitre={d.agendaCulturel}
        titre={l === "ar" ? v.nom_ar : v.nom_fr}
        titreSecondaire={l === "ar" ? { texte: v.nom_fr, lang: "fr" } : { texte: v.nom_ar, lang: "ar" }}
        teinte="bg-bleu text-white"
        illustration={<MiniCarte ville={v.slug} className="h-44 w-auto text-white" />}
      >
        {v.gouvernorat !== v.nom_fr && <p className="text-sm opacity-80">{v.gouvernorat}</p>}
      </BandeauPage>
      <Suspense fallback={<ChargementResultats />}>
        <Contenu ville={ville} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Contenu({ ville, searchParams }: { ville: string; searchParams: PageProps<"/[lang]/ville/[ville]">["searchParams"] }) {
  const [l, p] = await Promise.all([langue(), searchParams]);
  return <Resultats l={l} criteres={lireCriteres(p, { ville })} base={`/${l}/ville/${ville}`} />;
}
