import { Suspense } from "react";
import type { Metadata } from "next";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { ChargementResultats, lireCriteres, Resultats } from "@/components/public/resultats";
import { BandeauPage } from "@/components/public/bandeau-page";

export async function generateMetadata(): Promise<Metadata> {
  const l = await langue();
  return { title: t(l).agenda, alternates: { canonical: `/${l}/evenements`, languages: { fr: "/fr/evenements", ar: "/ar/evenements" } } };
}

export default async function PageAgenda({ searchParams }: PageProps<"/[lang]/evenements">) {
  const l = await langue();
  const d = t(l);
  return (
    <>
      <BandeauPage surtitre={d.accroche} titre={d.agenda} teinte="bg-bleu text-white" illustration={<Calligraphie />}>
        <p className="max-w-xl text-base opacity-85 sm:text-lg">{d.sousSlogan}</p>
      </BandeauPage>
      <Suspense fallback={<ChargementResultats />}>
        <Contenu searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Calligraphie() {
  return (
    <p lang="ar" dir="rtl" className="font-[family-name:var(--font-arabe)] text-7xl font-bold opacity-90 lg:text-8xl">
      وقتاش<span className="text-safran">؟</span>
    </p>
  );
}

async function Contenu({ searchParams }: { searchParams: PageProps<"/[lang]/evenements">["searchParams"] }) {
  const [l, p] = await Promise.all([langue(), searchParams]);
  const criteres = lireCriteres(p);
  // Choisir une ville ou une catégorie dans le formulaire garde l'URL /evenements (filtres en paramètres)
  return <Resultats l={l} criteres={criteres} base={`/${l}/evenements`} />;
}
