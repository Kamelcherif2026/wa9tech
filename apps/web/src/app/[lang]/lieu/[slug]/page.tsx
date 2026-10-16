import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import { lieuPublic, referentiels } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { GrilleEvenements } from "@/components/public/carte-evenement";
import { BandeauPage } from "@/components/public/bandeau-page";
import { MiniCarte } from "@/components/public/mini-carte";
import { Section } from "@/components/public/section";

export async function generateMetadata({ params }: PageProps<"/[lang]/lieu/[slug]">): Promise<Metadata> {
  const [{ slug }, l] = await Promise.all([params, langue()]);
  const r = await lieuPublic(slug);
  if (!r) return {};
  const nom = (l === "ar" && r.lieu.nom_ar) || r.lieu.nom;
  return {
    title: nom,
    description: [r.lieu.adresse, r.lieu.ville?.nom_fr].filter(Boolean).join(" · "),
    alternates: { canonical: `/${l}/lieu/${slug}`, languages: { fr: `/fr/lieu/${slug}`, ar: `/ar/lieu/${slug}` } },
  };
}

export default function PageLieu({ params }: PageProps<"/[lang]/lieu/[slug]">) {
  return (
    <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-muted" />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/[lang]/lieu/[slug]">["params"] }) {
  const [{ slug }, l] = await Promise.all([params, langue()]);
  const [r, { villes, categories }] = await Promise.all([lieuPublic(slug), referentiels()]);
  if (!r) notFound();
  const { lieu, cartes } = r;
  const d = t(l);
  const nom = (l === "ar" && lieu.nom_ar) || lieu.nom;

  const lienInfo = "inline-flex h-10 items-center gap-2 rounded-full border-2 border-current px-4 text-sm font-semibold transition hover:bg-sable hover:text-encre hover:border-sable";

  return (
    <>
      <BandeauPage
        surtitre={d.lieuCulturel}
        titre={nom}
        titreSecondaire={l === "fr" && lieu.nom_ar ? { texte: lieu.nom_ar, lang: "ar" } : undefined}
        teinte="bg-encre text-sable"
        illustration={lieu.ville ? <MiniCarte ville={lieu.ville.slug} className="h-44 w-auto text-sable" /> : undefined}
      >
        {(lieu.adresse || lieu.ville) && (
          <p className="flex items-center gap-2 opacity-85">
            <MapPin className="size-4 shrink-0 text-safran" />
            <span dir="auto">{[lieu.adresse, lieu.ville && (l === "ar" ? lieu.ville.nom_ar : lieu.ville.nom_fr)].filter(Boolean).join(" · ")}</span>
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {lieu.telephone && (
            <a href={`tel:+216${lieu.telephone.replace(/\D/g, "").replace(/^216/, "")}`} className={lienInfo}>
              <Phone className="size-4" /> <span dir="ltr">{lieu.telephone}</span>
            </a>
          )}
          {lieu.lien && (
            <a href={lieu.lien} target="_blank" rel="noreferrer" className={lienInfo}>
              <ExternalLink className="size-4" /> {d.plusInfos}
            </a>
          )}
          {lieu.lat != null && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}`} target="_blank" rel="noreferrer" className={lienInfo}>
              <Navigation className="size-4" /> {d.itineraire}
            </a>
          )}
        </div>
      </BandeauPage>

      <Section titre={d.aVenirIci}>
        {cartes.length ? (
          <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />
        ) : (
          <p className="rounded-3xl border-2 border-dashed border-encre/15 bg-card p-10 text-center text-muted-foreground">{d.aucunResultat}</p>
        )}
      </Section>

      {lieu.lat != null && lieu.lng != null && (
        <Section titre={d.surLaCarte}>
          <iframe
            title={nom}
            loading="lazy"
            className="h-72 w-full rounded-2xl shadow-sm ring-1 ring-border"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lieu.lng - 0.008},${lieu.lat - 0.005},${lieu.lng + 0.008},${lieu.lat + 0.005}&layer=mapnik&marker=${lieu.lat},${lieu.lng}`}
          />
        </Section>
      )}
    </>
  );
}
