import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, CalendarPlus, ExternalLink, MapPin, Navigation, Phone, Ticket } from "lucide-react";
import { fiche, referentiels, similaires } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { dateLongue, heure, morceauxDate } from "@/lib/public/dates";
import { teinteCategorie } from "@/lib/public/teintes";
import { cn } from "@/lib/utils";
import { t, type Langue } from "@/lib/i18n";
import { GrilleEvenements } from "@/components/public/carte-evenement";
import { Partage } from "@/components/public/partage";
import { Section } from "@/components/public/section";
import { Etoile, Porte } from "@/components/public/motifs";
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
  const villeBrute = e.ville ? (l === "ar" ? e.ville.nom_ar : e.ville.nom_fr) : null;
  // Pas de « Tunis · Tunis » quand le texte du lieu contient déjà la ville
  const nomVille = villeBrute && !nomLieu?.toLowerCase().includes(villeBrute.toLowerCase()) ? villeBrute : null;

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

  const teinte = teinteCategorie(categories, e.categorie?.id);
  // Date mise à jour par la base (pas de new Date() ici : la page reste pré-rendable)
  const prochaine = e.prochaine_date ?? dates[0]?.debut;

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CompteurVue id={e.id} />

      {/* En-tête coloré selon la discipline */}
      <header className={cn("pleine-largeur motif-zellige relative overflow-hidden [--motif-opacite:0.12]", teinte)}>
        <Porte className="pointer-events-none absolute -start-12 -bottom-28 h-96 w-64 opacity-10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:pb-16">
          {/* Affiche collée au mur, entière (jamais recadrée) */}
          <div className="relative mx-auto w-full max-w-64 sm:max-w-sm">
            {e.images[0] ? (
              <a href={e.images[0]} target="_blank" rel="noreferrer" className="group relative block -rotate-[1.5deg] transition duration-300 hover:rotate-0">
                <span className="scotch" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.images[0]} alt={titre} className="w-full rounded-md border-[6px] border-sable bg-sable shadow-2xl" />
              </a>
            ) : (
              <div className="arche motif-zellige aspect-[4/5] border-[6px] border-sable bg-sable text-primary shadow-2xl [--motif-opacite:0.15]" />
            )}
            {e.images.length > 1 && (
              <div className="mt-5 grid grid-cols-4 gap-2">
                {e.images.slice(1).map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="aspect-square w-full rounded-md border-2 border-sable object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="text-center md:text-start">
            {e.categorie && (
              <Link
                href={`/${l}/categorie/${e.categorie.slug}`}
                className="inline-block -rotate-2 rounded-sm bg-sable px-2.5 py-1 text-xs font-extrabold tracking-wider text-encre uppercase transition hover:rotate-0"
              >
                {l === "ar" ? e.categorie.libelle_ar : e.categorie.libelle_fr}
              </Link>
            )}
            <h1 dir="auto" className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{titre}</h1>
            {l === "fr" && e.titre_ar && (
              <p className="mt-2"><span className="inline-block font-[family-name:var(--font-arabe)] text-2xl font-bold opacity-80" dir="rtl" lang="ar">{e.titre_ar}</span></p>
            )}
            {e.verifie && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-sm font-semibold"><BadgeCheck className="size-4" /> {d.verifie}</p>
            )}

            <div className="mt-6 space-y-2 text-base sm:text-lg">
              {prochaine && (
                <p className="flex items-center justify-center gap-2 md:justify-start">
                  <CalendarDays className="size-5 shrink-0" />
                  <span className="first-letter:uppercase">{dateLongue(prochaine, l)}</span>
                  <span className="font-bold tabular-nums">· {heure(prochaine, l)}</span>
                </p>
              )}
              {nomLieu && (
                <p className="flex items-center justify-center gap-2 md:justify-start">
                  <MapPin className="size-5 shrink-0" />
                  <span dir="auto">{[nomLieu, nomVille].filter(Boolean).join(" · ")}</span>
                </p>
              )}
              <p className="flex items-center justify-center gap-2 font-bold md:justify-start">
                <Ticket className="size-5 shrink-0" />
                <Prix e={e} l={l} />
              </p>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
              <a href="#reserver" className="inline-flex h-12 items-center gap-2 rounded-full bg-sable px-6 font-bold text-encre shadow-lg transition hover:bg-safran">
                <Ticket className="size-5" /> {d.commentReserver}
              </a>
              <a href={`/api/ics/${e.slug}`} className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-current px-5 font-semibold transition hover:bg-black/10">
                <CalendarPlus className="size-5" /> {d.ajouterCalendrier}
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-8">
          {/* Dates en billets */}
          <section>
            <h2 className="mb-4 flex items-center gap-2.5 text-2xl font-extrabold"><Etoile className="size-5 text-safran" /> {d.dates}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {dates.map((r) => {
                const m = morceauxDate(r.debut, l);
                return (
                  <li key={r.debut} className="flex overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
                    <div className="flex w-20 shrink-0 flex-col items-center justify-center border-e-2 border-dashed border-background bg-safran py-3 text-encre">
                      <span className="text-xs font-semibold uppercase">{m.semaine}</span>
                      <span className="font-[family-name:var(--font-titre)] text-3xl leading-none font-extrabold tabular-nums">{m.jour}</span>
                      <span className="text-xs font-bold uppercase">{m.mois}</span>
                    </div>
                    <div className="flex flex-1 flex-col justify-center px-4 py-3">
                      <span className="text-sm text-muted-foreground first-letter:uppercase">{dateLongue(r.debut, l)}</span>
                      <span className="font-[family-name:var(--font-titre)] text-2xl font-extrabold tabular-nums text-primary">{heure(r.debut, l)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {description && (
            <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <p dir="auto" className="text-lg leading-relaxed whitespace-pre-line">{description}</p>
              {e.organisateur && (
                <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                  {d.organisePar} : <span className="font-semibold text-foreground">{e.organisateur.nom}</span>
                </p>
              )}
            </section>
          )}
          {!description && e.organisateur && (
            <p className="text-sm text-muted-foreground">
              {d.organisePar} : <span className="font-semibold text-foreground">{e.organisateur.nom}</span>
            </p>
          )}

          {/* Lieu */}
          {nomLieu && (
            <section>
              <h2 className="mb-4 flex items-center gap-2.5 text-2xl font-extrabold"><Etoile className="size-5 text-safran" /> {d.lieu}</h2>
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
                {e.lieu?.lat != null && e.lieu?.lng != null && (
                  <iframe
                    title={nomLieu}
                    loading="lazy"
                    className="h-60 w-full border-b"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${e.lieu.lng - 0.006},${e.lieu.lat - 0.004},${e.lieu.lng + 0.006},${e.lieu.lat + 0.004}&layer=mapnik&marker=${e.lieu.lat},${e.lieu.lng}`}
                  />
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <p className="flex items-start gap-2 font-semibold">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                      {e.lieu ? <Link href={`/${l}/lieu/${e.lieu.slug}`} className="hover:text-primary hover:underline">{nomLieu}</Link> : nomLieu}
                      {nomVille && <span className="font-normal text-muted-foreground"> · {nomVille}</span>}
                      {e.lieu?.adresse && <span dir="auto" className="block text-sm font-normal text-muted-foreground">{e.lieu.adresse}</span>}
                    </span>
                  </p>
                  {e.lieu?.lat != null && e.lieu?.lng != null && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${e.lieu.lat},${e.lieu.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-encre px-4 text-sm font-semibold transition hover:bg-encre hover:text-sable"
                    >
                      <Navigation className="size-4" /> {d.itineraire}
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Colonne réservation */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section id="reserver" className="motif-zellige scroll-mt-24 overflow-hidden rounded-2xl bg-terracotta p-6 text-white shadow-lg [--motif-opacite:0.1]">
            <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] uppercase opacity-85"><Etoile className="size-3.5 text-safran" /> {d.billet}</p>
            <p className="mt-2 font-[family-name:var(--font-titre)] text-3xl font-extrabold"><Prix e={e} l={l} clair /></p>
            {e.infos_reservation && <p dir="auto" className="mt-3 text-sm whitespace-pre-line opacity-90">{e.infos_reservation}</p>}
            <div className="mt-5 grid gap-2">
              {e.telephone_reservation && (
                <LienReservation id={e.id} href={`tel:+216${e.telephone_reservation.replace(/\D/g, "").replace(/^216/, "")}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sable px-5 font-bold text-encre transition hover:bg-safran">
                  <Phone className="size-4" /> {d.appeler} <span dir="ltr">{e.telephone_reservation}</span>
                </LienReservation>
              )}
              {e.lien_externe && (
                <LienReservation id={e.id} href={e.lien_externe}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-white/70 px-5 font-semibold transition hover:bg-white hover:text-terracotta">
                  <ExternalLink className="size-4" /> {d.plusInfos}
                </LienReservation>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <h2 className="mb-3 text-xs font-extrabold tracking-[0.2em] text-muted-foreground uppercase">{d.partager}</h2>
            <Partage url={url} titre={titre} libelles={{ partager: d.partager, copier: d.copierLien, copie: d.lienCopie }} />
          </section>
        </aside>
      </div>

      {autres.length > 0 && (
        <Section titre={d.similaires}>
          <GrilleEvenements cartes={autres} l={l} villes={villes} categories={categories} />
        </Section>
      )}
    </article>
  );
}

function Prix({ e, l, clair }: { e: { gratuit: boolean; prix_min: number | null; prix_max: number | null }; l: Langue; clair?: boolean }) {
  const d = t(l);
  if (e.gratuit) return <span>{d.gratuit}</span>;
  if (e.prix_min == null) return <span className={clair ? "text-xl opacity-85" : "font-normal opacity-85"}>{d.prixNonCommunique}</span>;
  const nb = (n: number) => Number(n).toLocaleString(l === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");
  if (e.prix_max != null && e.prix_max !== e.prix_min) return <span>{nb(e.prix_min)} – {nb(e.prix_max)} {d.dt}</span>;
  return <span>{nb(e.prix_min)} {d.dt}</span>;
}
