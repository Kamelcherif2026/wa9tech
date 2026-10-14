import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { langue } from "@/lib/public/langue";
import { referentiels } from "@/lib/public/requetes";
import { t } from "@/lib/i18n";
import { ChargementResultats, lireCriteres, Resultats } from "@/components/public/resultats";

export async function generateStaticParams() {
  const { villes } = await referentiels();
  return villes.map((v) => ({ ville: v.slug }));
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
  return (
    <div className="pt-8">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">{t(l).agendaDe(l === "ar" ? v.nom_ar : v.nom_fr)}</h1>
      <Suspense fallback={<ChargementResultats />}>
        <Contenu ville={ville} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenu({ ville, searchParams }: { ville: string; searchParams: PageProps<"/[lang]/ville/[ville]">["searchParams"] }) {
  const [l, p] = await Promise.all([langue(), searchParams]);
  return <Resultats l={l} criteres={lireCriteres(p, { ville })} base={`/${l}/ville/${ville}`} />;
}
