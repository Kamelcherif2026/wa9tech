import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { Carte, CategoriePub, VillePub } from "@/lib/public/requetes";
import { heure, morceauxDate } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Inclinaisons légères et variées : les cartes ressemblent à des affiches collées au mur. */
const INCLINAISONS = ["group-hover:-rotate-1", "group-hover:rotate-1", "group-hover:-rotate-[0.6deg]", "group-hover:rotate-[0.6deg]"];

export function CarteEvenement({
  e,
  l,
  villes,
  categories,
  rang = 0,
}: {
  e: Carte;
  l: Langue;
  villes: VillePub[];
  categories: CategoriePub[];
  rang?: number;
}) {
  const d = t(l);
  const titre = (l === "ar" && e.titre_ar) || e.titre_fr;
  const ville = villes.find((v) => v.id === e.ville_id);
  const cat = categories.find((c) => c.id === e.categorie_id);
  const date = e.prochaine_date ? morceauxDate(e.prochaine_date, l) : null;

  return (
    <Link
      href={`/${l}/evenement/${e.slug}`}
      className="group flex flex-col rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div
        className={cn(
          "relative aspect-[4/5] rounded-lg bg-muted shadow-[0_1px_2px_rgb(0_0_0/0.08),0_8px_20px_-12px_rgb(0_0_0/0.35)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_2px_4px_rgb(0_0_0/0.08),0_18px_30px_-14px_rgb(0_0_0/0.45)]",
          INCLINAISONS[rang % INCLINAISONS.length],
        )}
      >
        <span className="scotch opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {e.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="motif-zellige flex h-full items-center justify-center bg-accent p-4 text-center text-primary [--motif-opacite:0.15]">
              <span dir="auto" className="font-[family-name:var(--font-titre)] text-lg font-extrabold">{titre}</span>
            </div>
          )}
        </div>

        {/* Étiquette « billet » : la date en grand */}
        {date && (
          <div className="absolute -bottom-5 start-3 flex min-w-13 flex-col items-center rounded-md bg-safran px-2 pt-1 pb-1.5 ring-2 ring-background text-encre shadow-md">
            <span className="text-[0.65rem] font-semibold uppercase leading-none tracking-wide">{date.semaine}</span>
            <span className="font-[family-name:var(--font-titre)] text-2xl font-extrabold leading-none tabular-nums">{date.jour}</span>
            <span className="text-[0.7rem] font-bold uppercase leading-none">{date.mois}</span>
          </div>
        )}
        {e.gratuit && (
          <span className="absolute top-2 end-2 -rotate-3 rounded-sm bg-success px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase shadow">
            {d.gratuit}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-0.5 pt-7">
        {cat && (
          <span className="text-xs font-bold tracking-wide text-primary uppercase">
            {l === "ar" ? cat.libelle_ar : cat.libelle_fr}
          </span>
        )}
        <h3 dir="auto" className="line-clamp-2 text-base font-bold leading-snug decoration-primary decoration-2 underline-offset-4 group-hover:underline">
          {titre}
        </h3>
        <div className="mt-auto space-y-0.5 pt-1 text-sm text-muted-foreground">
          {e.prochaine_date && (
            <p className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              <span className="tabular-nums">{heure(e.prochaine_date, l)}</span>
            </p>
          )}
          {(e.lieu_nom || ville) && (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span dir="auto" className="line-clamp-1">
                {[e.lieu_nom, ville && (l === "ar" ? ville.nom_ar : ville.nom_fr)].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function GrilleEvenements({
  cartes,
  l,
  villes,
  categories,
}: {
  cartes: Carte[];
  l: Langue;
  villes: VillePub[];
  categories: CategoriePub[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {cartes.map((e, i) => (
        <CarteEvenement key={e.id} e={e} l={l} villes={villes} categories={categories} rang={i} />
      ))}
    </div>
  );
}
