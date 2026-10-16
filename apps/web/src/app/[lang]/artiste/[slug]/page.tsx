import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Mic2 } from "lucide-react";
import { artistePublic, referentiels } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { BandeauPage } from "@/components/public/bandeau-page";
import { GrilleEvenements } from "@/components/public/carte-evenement";
import { Section } from "@/components/public/section";

export async function generateMetadata({ params }: PageProps<"/[lang]/artiste/[slug]">): Promise<Metadata> {
  const [{ slug }, l] = await Promise.all([params, langue()]);
  const r = await artistePublic(slug);
  if (!r) return {};
  const nom = (l === "ar" && r.artiste.nom_ar) || r.artiste.nom;
  return {
    title: nom,
    description: `${t(l).prochainesDates} — ${nom}`,
    alternates: { canonical: `/${l}/artiste/${slug}`, languages: { fr: `/fr/artiste/${slug}`, ar: `/ar/artiste/${slug}` } },
  };
}

export default function PageArtiste({ params }: PageProps<"/[lang]/artiste/[slug]">) {
  return (
    <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-muted" />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/[lang]/artiste/[slug]">["params"] }) {
  const [{ slug }, l] = await Promise.all([params, langue()]);
  const [r, { villes, categories }] = await Promise.all([artistePublic(slug), referentiels()]);
  if (!r) notFound();
  const { artiste, cartes } = r;
  const d = t(l);
  const nom = (l === "ar" && artiste.nom_ar) || artiste.nom;
  const autreNom = l === "ar" ? (artiste.nom_ar && artiste.nom !== artiste.nom_ar ? artiste.nom : null) : (artiste.nom_ar !== artiste.nom ? artiste.nom_ar : null);

  return (
    <>
      <BandeauPage
        surtitre={d.artiste}
        titre={nom}
        titreSecondaire={autreNom ? { texte: autreNom, lang: l === "ar" ? "fr" : "ar" } : undefined}
        teinte="bg-safran text-encre"
        illustration={<Mic2 className="size-36 opacity-85 lg:size-44" strokeWidth={1.25} />}
      >
        {artiste.lien && (
          <a
            href={artiste.lien}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-current px-4 text-sm font-semibold transition hover:bg-encre hover:text-sable hover:border-encre"
          >
            <ExternalLink className="size-4" /> {d.siteArtiste}
          </a>
        )}
      </BandeauPage>

      <Section titre={d.prochainesDates}>
        {cartes.length ? (
          <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />
        ) : (
          <p className="rounded-3xl border-2 border-dashed border-encre/15 bg-card p-10 text-center text-muted-foreground">{d.aucuneDateArtiste}</p>
        )}
      </Section>
    </>
  );
}
