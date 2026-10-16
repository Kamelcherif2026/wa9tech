import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { langue } from "@/lib/public/langue";
import { referentiels } from "@/lib/public/requetes";
import { parente, teinteCategorie } from "@/lib/public/teintes";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChargementResultats, lireCriteres, Resultats } from "@/components/public/resultats";
import { BandeauPage } from "@/components/public/bandeau-page";
import { ICONES } from "@/components/public/disciplines";
import { Etoile } from "@/components/public/motifs";

export async function generateStaticParams() {
  const { categories } = await referentiels();
  // Au moins une valeur est exigée par Next.js (même si la base est injoignable pendant le build)
  return categories.length ? categories.map((c) => ({ categorie: c.slug })) : [{ categorie: "musique" }];
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
  const d = t(l);
  const p = parente(categories, c.id)!;
  const sous = categories.filter((x) => x.parent_id === p.id);
  const Icone = ICONES[p.slug] ?? Etoile;
  const libelle = (x: typeof c) => (l === "ar" ? x.libelle_ar : x.libelle_fr);
  const pastille = (actif: boolean) =>
    cn(
      "inline-flex h-8 items-center rounded-full border-2 border-current px-3.5 text-sm font-semibold transition",
      actif ? "bg-sable text-encre border-sable" : "opacity-85 hover:opacity-100",
    );

  return (
    <>
      <BandeauPage
        surtitre={c.parent_id ? libelle(p) : d.discipline}
        titre={libelle(c)}
        titreSecondaire={l === "ar" ? { texte: c.libelle_fr, lang: "fr" } : { texte: c.libelle_ar, lang: "ar" }}
        teinte={teinteCategorie(categories, c.id)}
        illustration={<Icone className="size-36 opacity-90 lg:size-44" strokeWidth={1.25} />}
      >
        {sous.length > 0 && (
          <nav className="flex flex-wrap gap-2">
            <Link href={`/${l}/categorie/${p.slug}`} className={pastille(c.id === p.id)}>{d.toutes}</Link>
            {sous.map((s) => (
              <Link key={s.slug} href={`/${l}/categorie/${s.slug}`} className={pastille(s.id === c.id)}>{libelle(s)}</Link>
            ))}
          </nav>
        )}
      </BandeauPage>
      <Suspense fallback={<ChargementResultats />}>
        <Contenu categorie={categorie} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Contenu({ categorie, searchParams }: { categorie: string; searchParams: PageProps<"/[lang]/categorie/[categorie]">["searchParams"] }) {
  const [l, p] = await Promise.all([langue(), searchParams]);
  return <Resultats l={l} criteres={lireCriteres(p, { categorie })} base={`/${l}/categorie/${categorie}`} />;
}
