import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import { lieuPublic, referentiels } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { GrilleEvenements } from "@/components/public/carte-evenement";

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

  return (
    <div className="pt-8">
      <h1 className="text-3xl font-bold tracking-tight">{nom}</h1>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {(lieu.adresse || lieu.ville) && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" />
            {[lieu.adresse, lieu.ville && (l === "ar" ? lieu.ville.nom_ar : lieu.ville.nom_fr)].filter(Boolean).join(" · ")}
          </span>
        )}
        {lieu.telephone && (
          <a href={`tel:+216${lieu.telephone.replace(/\D/g, "").replace(/^216/, "")}`} className="flex items-center gap-1.5 hover:text-primary">
            <Phone className="size-4" /> <span dir="ltr">{lieu.telephone}</span>
          </a>
        )}
        {lieu.lien && (
          <a href={lieu.lien} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary">
            <ExternalLink className="size-4" /> {d.plusInfos}
          </a>
        )}
        {lieu.lat != null && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary">
            <Navigation className="size-4" /> {d.itineraire}
          </a>
        )}
      </div>

      <h2 className="mt-10 mb-4 text-xl font-bold">{d.aVenirIci}</h2>
      {cartes.length ? (
        <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />
      ) : (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{d.aucunResultat}</p>
      )}
    </div>
  );
}
