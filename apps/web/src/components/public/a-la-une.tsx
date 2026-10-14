import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Carte, CategoriePub, VillePub } from "@/lib/public/requetes";
import { dateLongue, heure } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";
import { Etoile } from "./motifs";
import { Defilement } from "./defilement";

/** Grand bandeau terracotta : un événement par diapositive, l'affiche dans un arc de porte. */
export function ALaUne({
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
  const d = t(l);
  if (!cartes.length) return null;

  return (
    <section aria-labelledby="titre-une" className="pleine-largeur motif-zellige mt-12 bg-terracotta text-white [--motif-opacite:0.1]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 id="titre-une" className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              <Etoile className="size-5 text-safran" /> {d.aLaUne}
            </h2>
            <p className="mt-1 ps-7.5 text-sm text-white/75">{d.aLaUneSousTitre}</p>
          </div>
        </div>

        <Defilement nombre={cartes.length} libelles={{ precedent: d.precedent, suivant: d.suivant }}>
          {cartes.map((e) => {
            const titre = (l === "ar" && e.titre_ar) || e.titre_fr;
            const cat = categories.find((c) => c.id === e.categorie_id);
            const ville = villes.find((v) => v.id === e.ville_id);
            return (
              <article key={e.id} className="grid items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
                {/* Affiche dans un arc de porte */}
                <Link href={`/${l}/evenement/${e.slug}`} className="relative mx-auto w-full max-w-72 md:max-w-80" tabIndex={-1} aria-hidden="true">
                  <span className="absolute -end-5 top-1/4 size-20 rounded-full bg-safran" />
                  <div className="arche relative aspect-[4/5] overflow-hidden border-[6px] border-sable bg-sable shadow-2xl">
                    {e.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="motif-zellige h-full bg-bleu text-white" />
                    )}
                  </div>
                </Link>

                {/* Informations */}
                <div className="text-center md:text-start">
                  {cat && (
                    <span className="inline-block -rotate-2 rounded-sm bg-safran px-2.5 py-1 text-xs font-extrabold tracking-wider text-encre uppercase">
                      {l === "ar" ? cat.libelle_ar : cat.libelle_fr}
                    </span>
                  )}
                  <h3 dir="auto" className="mt-3 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                    {titre}
                  </h3>
                  {l === "fr" && e.titre_ar && (
                    <p className="mt-2"><span dir="rtl" lang="ar" className="inline-block text-2xl font-bold text-white/80">{e.titre_ar}</span></p>
                  )}
                  <div className="mt-5 space-y-2 text-base sm:text-lg">
                    {e.prochaine_date && (
                      <p className="flex items-center justify-center gap-2 md:justify-start">
                        <CalendarDays className="size-5 shrink-0 text-safran" />
                        <span className="first-letter:uppercase">{dateLongue(e.prochaine_date, l)}</span>
                        <span className="font-bold tabular-nums">· {heure(e.prochaine_date, l)}</span>
                      </p>
                    )}
                    {(e.lieu_nom || ville) && (
                      <p className="flex items-center justify-center gap-2 md:justify-start">
                        <MapPin className="size-5 shrink-0 text-safran" />
                        <span dir="auto">{[e.lieu_nom, ville && (l === "ar" ? ville.nom_ar : ville.nom_fr)].filter(Boolean).join(" · ")}</span>
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/${l}/evenement/${e.slug}`}
                    className="group mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-sable px-6 font-bold text-encre shadow-lg transition hover:bg-safran"
                  >
                    {d.voirEvenement}
                    <ArrowRight className="size-5 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </Defilement>
      </div>
    </section>
  );
}
