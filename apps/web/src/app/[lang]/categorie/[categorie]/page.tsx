import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { langue } from "@/lib/public/langue";
import { referentiels } from "@/lib/public/requetes";
import { t } from "@/lib/i18n";
import { ChargementResultats, lireCriteres, Resultats } from "@/components/public/resultats";

export async function generateStaticParams() {
  const { categories } = await referentiels();
  return categories.map((c) => ({ categorie: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/categorie/[categorie]">): Promise<Metadata> {
  const [{ categorie }, l, { categories }] = await Promise.all([params, langue(), referentiels()]);
  const c = categories.find((x) => x.slug === categorie);
  if (!c) return {};
  return {
    title: t(l).evenementsCategorie(l === "ar" ? c.libelle_ar : c.libelle_fr),
    alternates: { canonical: `/${l}/categorie/${categorie}`, languages: { fr: `/fr/categorie/${categorie}`, ar: `/ar/categorie/${categorie}` } },
  };
}

export default function PageCategorie({ params, searchParams }: PageProps<"/[lang]/categorie/[categorie]">) {
  return (
    <Suspense fallback={<ChargementResultats />}>
      <Entete params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Entete({ params, searchParams }: { params: PageProps<"/[lang]/categorie/[categorie]">["params"]; searchParams: PageProps<"/[lang]/categorie/[categorie]">["searchParams"] }) {
  const [{ categorie }, l, { categories }] = await Promise.all([params, langue(), referentiels()]);
  const c = categories.find((x) => x.slug === categorie);
  if (!c) notFound();
  return (
    <div className="pt-8">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">{t(l).evenementsCategorie(l === "ar" ? c.libelle_ar : c.libelle_fr)}</h1>
      <Suspense fallback={<ChargementResultats />}>
        <Contenu categorie={categorie} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenu({ categorie, searchParams }: { categorie: string; searchParams: PageProps<"/[lang]/categorie/[categorie]">["searchParams"] }) {
  const [l, p] = await Promise.all([langue(), searchParams]);
  return <Resultats l={l} criteres={lireCriteres(p, { categorie })} base={`/${l}/categorie/${categorie}`} />;
}
