import { Suspense } from "react";
import type { Metadata } from "next";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { ChargementResultats, lireCriteres, Resultats } from "@/components/public/resultats";

export async function generateMetadata(): Promise<Metadata> {
  const l = await langue();
  return { title: t(l).agenda, alternates: { canonical: `/${l}/evenements`, languages: { fr: "/fr/evenements", ar: "/ar/evenements" } } };
}

export default async function PageAgenda({ searchParams }: PageProps<"/[lang]/evenements">) {
  const l = await langue();
  return (
    <div className="pt-8">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">{t(l).agenda}</h1>
      <Suspense fallback={<ChargementResultats />}>
        <Contenu searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/[lang]/evenements">["searchParams"] }) {
  const [l, p] = await Promise.all([langue(), searchParams]);
  const criteres = lireCriteres(p);
  // Choisir une ville ou une catégorie dans le formulaire garde l'URL /evenements (filtres en paramètres)
  return <Resultats l={l} criteres={criteres} base={`/${l}/evenements`} />;
}
