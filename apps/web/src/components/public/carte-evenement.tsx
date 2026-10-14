import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Carte, CategoriePub, VillePub } from "@/lib/public/requetes";
import { dateCourte, heure } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";

export function CarteEvenement({
  e,
  l,
  villes,
  categories,
}: {
  e: Carte;
  l: Langue;
  villes: VillePub[];
  categories: CategoriePub[];
}) {
  const d = t(l);
  const titre = (l === "ar" && e.titre_ar) || e.titre_fr;
  const ville = villes.find((v) => v.id === e.ville_id);
  const cat = categories.find((c) => c.id === e.categorie_id);

  return (
    <Link
      href={`/${l}/evenement/${e.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="relative aspect-[4/5] bg-muted">
        {e.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        {cat && (
          <span className="absolute top-2 start-2 rounded-md bg-black/65 px-2 py-0.5 text-xs font-medium text-white">
            {l === "ar" ? cat.libelle_ar : cat.libelle_fr}
          </span>
        )}
        {e.gratuit && (
          <span className="absolute top-2 end-2 rounded-md bg-success px-2 py-0.5 text-xs font-semibold text-white">
            {d.gratuit}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 dir="auto" className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{titre}</h3>
        {e.prochaine_date && (
          <p className="flex items-center gap-1.5 text-sm text-primary">
            <CalendarDays className="size-4 shrink-0" />
            {dateCourte(e.prochaine_date, l)} · {heure(e.prochaine_date, l)}
          </p>
        )}
        {(e.lieu_nom || ville) && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span dir="auto" className="line-clamp-1">
              {[e.lieu_nom, ville && (l === "ar" ? ville.nom_ar : ville.nom_fr)].filter(Boolean).join(" · ")}
            </span>
          </p>
        )}
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {cartes.map((e) => (
        <CarteEvenement key={e.id} e={e} l={l} villes={villes} categories={categories} />
      ))}
    </div>
  );
}
