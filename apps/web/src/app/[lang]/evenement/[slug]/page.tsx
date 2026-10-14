import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarPlus, ExternalLink, MapPin, Navigation, Phone, Ticket } from "lucide-react";
import { fiche, referentiels, similaires } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { dateLongue, heure } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";
import { GrilleEvenements } from "@/components/public/carte-evenement";
import { Partage } from "@/components/public/partage";
import { CompteurVue, LienReservation } from "@/components/public/statistiques";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wa9tech.tn";

const TYPES_SCHEMA: Record<string, string> = {
  musique: "MusicEvent", theatre: "TheaterEvent", cinema: "ScreeningEvent", "arts-visuels": "ExhibitionEvent",
  danse: "DanceEvent", festivals: "Festival", rencontres: "EducationEvent", ateliers: "EducationEvent",
  patrimoine: "Event", "jeune-public": "ChildrensEvent",
};

export async function generateMetadata({ params }: PageProps<"/[lang]/evenement/[slug]">): Promise<Metadata> {
  const [{ slug }, l] = await Promise.all([params, langue()]);
  const e = await fiche(slug);
  if (!e) return {};
  const titre = (l === "ar" && e.titre_ar) || e.titre_fr;
  const lieu = e.lieu?.nom ?? e.lieu_texte ?? "";
  const quand = e.prochaine_date ? dateLongue(e.prochaine_date, l) : "";
  const description = [quand, lieu, e.ville && (l === "ar" ? e.ville.nom_ar : e.ville.nom_fr)].filter(Boolean).join(" · ");
  return {
    title: titre,
    description,
    alternates: { canonical: `/${l}/evenement/${slug}`, languages: { fr: `/fr/evenement/${slug}`, ar: `/ar/evenement/${slug}` } },
    openGraph: { title: titre, description, images: e.images[0] ? [{ url: e.images[0] }] : [], type: "article" },
    twitter: { card: "summary_large_image", title: titre, description, images: e.images.slice(0, 1) },
  };
}

export default function PageFiche({ params }: PageProps<"/[lang]/evenement/[slug]">) {
  return (
    <Suspense fallback={<div className="mt-6 h-[70vh] animate-pulse rounded-2xl bg-muted" />}>
      <FicheEvenement params={params} />
    </Suspense>
  );
}

async function FicheEvenement({ params }: { params: PageProps<"/[lang]/evenement/[slug]">["params"] }) {
  const [{ slug }, l] = await Promise.all([params, langue()]);
  const e = await fiche(slug);
  if (!e) notFound();
  const d = t(l);
  const [{ villes, categories }, autres] = await Promise.all([referentiels(), similaires(e.id)]);

  const titre = (l === "ar" && e.titre_ar) || e.titre_fr;
  const description = (l === "ar" && e.description_ar) || e.description_fr;
  const parent = e.categorie ? categories.find((c) => c.id === e.categorie!.id) : undefined;
  const slugParent = parent?.parent_id ? categories.find((c) => c.id === parent.parent_id)?.slug : parent?.slug;
  const dates = e.representations.filter((r) => !r.annulee);
  const url = `${SITE}/${l}/evenement/${e.slug}`;
  const nomLieu = e.lieu ? ((l === "ar" && e.lieu.nom_ar) || e.lieu.nom) : e.lieu_texte;
  const nomVille = e.ville ? (l === "ar" ? e.ville.nom_ar : e.ville.nom_fr) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": TYPES_SCHEMA[slugParent ?? ""] ?? "Event",
    name: e.titre_fr,
    ...(e.titre_ar ? { alternateName: e.titre_ar } : {}),
    description: e.description_fr ?? undefined,
    image: e.images,
    startDate: e.prochaine_date ?? dates[0]?.debut,
    endDate: dates.at(-1)?.fin ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: nomLieu ?? undefined,
      address: { "@type": "PostalAddress", streetAddress: e.lieu?.adresse ?? undefined, addressLocality: e.ville?.nom_fr, addressCountry: "TN" },
      ...(e.lieu?.lat ? { geo: { "@type": "GeoCoordinates", latitude: e.lieu.lat, longitude: e.lieu.lng } } : {}),
    },
    offers: {
      "@type": "Offer",
      price: e.gratuit ? 0 : (e.prix_min ?? undefined),
      priceCurrency: "TND",
      url: e.lien_externe ?? url,
      availability: "https://schema.org/InStock",
    },
    ...(e.organisateur ? { organizer: { "@type": "Organization", name: e.organisateur.nom, url: e.organisateur.lien ?? undefined } } : {}),
  };

  return (
    <article className="pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CompteurVue id={e.id} />

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Affiche */}
        <div className="space-y-3">
          {e.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.images[0]} alt={titre} className="w-full rounded-2xl border object-contain shadow-sm" />
          )}
          {e.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {e.images.slice(1).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-lg border object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* Informations */}
        <div className="space-y-6">
          <div>
            {e.categorie && (
              <Link href={`/${l}/categorie/${e.categorie.slug}`} className="text-sm font-medium text-primary hover:underline">
                {l === "ar" ? e.categorie.libelle_ar : e.categorie.libelle_fr}
              </Link>
            )}
            <h1 dir="auto" className="mt-1 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{titre}</h1>
            {l === "fr" && e.titre_ar && <p className="mt-1 text-xl text-muted-foreground" dir="rtl" lang="ar">{e.titre_ar}</p>}
            {e.verifie && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-success"><BadgeCheck className="size-4" /> {d.verifie}</p>
            )}
          </div>

          {/* Dates */}
          <Bloc titre={d.dates}>
            <ul className="space-y-1.5">
              {dates.map((r) => (
                <li key={r.debut} className="flex items-baseline justify-between gap-4 border-b border-dashed pb-1.5 last:border-0">
                  <span className="font-medium first-letter:uppercase">{dateLongue(r.debut, l)}</span>
                  <span className="tabular-nums text-primary">{heure(r.debut, l)}</span>
                </li>
              ))}
            </ul>
            <a href={`/api/ics/${e.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <CalendarPlus className="size-4" /> {d.ajouterCalendrier}
            </a>
          </Bloc>

          {/* Lieu */}
          {nomLieu && (
            <Bloc titre={d.lieu}>
              <p className="flex items-start gap-2 font-medium">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {e.lieu ? <Link href={`/${l}/lieu/${e.lieu.slug}`} className="hover:underline">{nomLieu}</Link> : nomLieu}
                  {nomVille && <span className="text-muted-foreground"> · {nomVille}</span>}
                  {e.lieu?.adresse && <span dir="auto" className="block text-sm font-normal text-muted-foreground">{e.lieu.adresse}</span>}
                </span>
              </p>
              {e.lieu?.lat != null && e.lieu?.lng != null && (
                <>
                  <iframe
                    title={nomLieu}
                    loading="lazy"
                    className="mt-3 h-52 w-full rounded-lg border"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${e.lieu.lng - 0.006},${e.lieu.lat - 0.004},${e.lieu.lng + 0.006},${e.lieu.lat + 0.004}&layer=mapnik&marker=${e.lieu.lat},${e.lieu.lng}`}
                  />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${e.lieu.lat},${e.lieu.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Navigation className="size-4" /> {d.itineraire}
                  </a>
                </>
              )}
            </Bloc>
          )}

          {/* Réservation */}
          <Bloc titre={d.commentReserver}>
            <p className="flex items-center gap-2 text-lg font-semibold">
              <Ticket className="size-5 text-primary" />
              <Prix e={e} l={l} />
            </p>
            {e.infos_reservation && <p dir="auto" className="mt-2 whitespace-pre-line text-sm">{e.infos_reservation}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {e.telephone_reservation && (
                <LienReservation id={e.id} href={`tel:+216${e.telephone_reservation.replace(/\D/g, "").replace(/^216/, "")}`}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Phone className="size-4" /> {d.appeler} <span dir="ltr">{e.telephone_reservation}</span>
                </LienReservation>
              )}
              {e.lien_externe && (
                <LienReservation id={e.id} href={e.lien_externe}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border bg-card px-4 font-semibold hover:bg-muted">
                  <ExternalLink className="size-4" /> {d.plusInfos}
                </LienReservation>
              )}
            </div>
          </Bloc>

          {description && <p dir="auto" className="whitespace-pre-line leading-relaxed">{description}</p>}

          {e.organisateur && (
            <p className="text-sm text-muted-foreground">
              {d.organisePar} : <span className="font-medium text-foreground">{e.organisateur.nom}</span>
            </p>
          )}

          <Bloc titre={d.partager}>
            <Partage url={url} titre={titre} libelles={{ partager: d.partager, copier: d.copierLien, copie: d.lienCopie }} />
          </Bloc>
        </div>
      </div>

      {autres.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold">{d.similaires}</h2>
          <GrilleEvenements cartes={autres} l={l} villes={villes} categories={categories} />
        </section>
      )}
    </article>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{titre}</h2>
      {children}
    </section>
  );
}

function Prix({ e, l }: { e: { gratuit: boolean; prix_min: number | null; prix_max: number | null }; l: Langue }) {
  const d = t(l);
  if (e.gratuit) return <span className="text-success">{d.gratuit}</span>;
  if (e.prix_min == null) return <span className="text-muted-foreground">{d.prixNonCommunique}</span>;
  const nb = (n: number) => Number(n).toLocaleString(l === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");
  if (e.prix_max != null && e.prix_max !== e.prix_min) return <span>{nb(e.prix_min)} – {nb(e.prix_max)} {d.dt}</span>;
  return <span>{nb(e.prix_min)} {d.dt}</span>;
}
