import Link from "next/link";
import type { VillePub } from "@/lib/public/requetes";
import { CARTE_HAUTEUR, CARTE_LARGEUR, CONTOUR_TUNISIE, POSITIONS_VILLES } from "@/lib/public/carte-tunisie";
import { t, type Langue } from "@/lib/i18n";

/** Villes toujours nommées sur la carte (les autres le sont dès qu'elles ont des événements). */
const REPERES = new Set(["tunis", "bizerte", "tabarka", "le-kef", "kairouan", "sousse", "sfax", "gafsa", "tozeur", "gabes", "djerba", "tataouine"]);
/** Grand Tunis : points trop proches pour être nommés séparément. */
const GRAND_TUNIS = new Set(["ariana", "ben-arous", "manouba", "la-marsa", "carthage", "sidi-bou-said"]);

/** Carte stylisée de la Tunisie + liste des villes, avec le nombre d'événements à venir. */
export function CarteVilles({ villes, comptes, l }: { villes: VillePub[]; comptes: Record<number, number>; l: Langue }) {
  const d = t(l);
  const nom = (v: VillePub) => (l === "ar" ? v.nom_ar : v.nom_fr);
  const max = Math.max(1, ...Object.values(comptes));
  const triees = [...villes].sort((a, b) => (comptes[b.id] ?? 0) - (comptes[a.id] ?? 0) || nom(a).localeCompare(nom(b), l));
  const actives = triees.filter((v) => comptes[v.id]);
  const autres = triees.filter((v) => !comptes[v.id]);

  return (
    <div className="grid items-center gap-8 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <svg
        viewBox={`0 0 ${CARTE_LARGEUR} ${CARTE_HAUTEUR}`}
        className="mx-auto h-auto max-h-[480px] w-full max-w-72"
        role="img"
        aria-label={d.explorerVilles}
        direction="ltr"
      >
        <defs>
          <pattern id="mer" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7q3.5-4 7 0t7 0" fill="none" stroke="var(--bleu)" strokeOpacity="0.18" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width={CARTE_LARGEUR} height={CARTE_HAUTEUR} fill="url(#mer)" rx="18" />
        <path d={CONTOUR_TUNISIE} fill="var(--background)" stroke="var(--bleu)" strokeWidth="2" strokeLinejoin="round" />

        {villes.map((v) => {
          const pos = POSITIONS_VILLES[v.slug];
          if (!pos) return null;
          const n = comptes[v.id] ?? 0;
          const r = n ? 4.5 + 5 * Math.sqrt(n / max) : 2.6;
          const etiquette = (n > 0 && !GRAND_TUNIS.has(v.slug)) || REPERES.has(v.slug);
          // Étiquette à gauche du point pour les villes de l'est (côte), à droite sinon
          const aGauche = pos[0] > CARTE_LARGEUR * 0.55;
          return (
            <a key={v.slug} href={`/${l}/ville/${v.slug}`} className="group outline-none">
              <title>{`${nom(v)} — ${d.nbEvenements(n)}`}</title>
              {n > 0 && (
                <circle cx={pos[0]} cy={pos[1]} r={r + 4} fill="var(--terracotta)" opacity="0.18">
                  <animate attributeName="r" values={`${r + 2};${r + 7};${r + 2}`} dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={r}
                fill={n ? "var(--terracotta)" : "var(--bleu)"}
                stroke="white"
                strokeWidth={n ? 1.5 : 1}
                className="transition group-hover:fill-[var(--safran)] group-focus-visible:fill-[var(--safran)]"
              />
              {etiquette && (
                <text
                  x={pos[0] + (aGauche ? -(r + 4) : r + 4)}
                  y={pos[1] + 4}
                  textAnchor={aGauche ? "end" : "start"}
                  fontSize={n ? 12 : 10.5}
                  fontWeight={n ? 700 : 500}
                  fill={n ? "var(--encre)" : "#6b6560"}
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeWidth="3"
                  className="group-hover:fill-[var(--terracotta)]"
                >
                  {nom(v)}
                </text>
              )}
            </a>
          );
        })}
      </svg>

      <div>
        <p className="text-muted-foreground">{d.explorerVillesTexte}</p>
        {actives.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {actives.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/${l}/ville/${v.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-encre py-1.5 ps-4 pe-1.5 text-sm font-semibold text-sable transition hover:bg-terracotta"
                >
                  {nom(v)}
                  <span className="rounded-full bg-safran px-2 py-0.5 text-xs font-bold text-encre tabular-nums">{comptes[v.id]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <details className="group mt-5" open={actives.length === 0}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary hover:underline [&::-webkit-details-marker]:hidden">
            {d.toutesLesVilles} ({villes.length}) <span className="inline-block transition group-open:rotate-180">▾</span>
          </summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {autres.map((v) => (
              <li key={v.slug}>
                <Link href={`/${l}/ville/${v.slug}`} className="inline-block rounded-full border bg-background px-3 py-1 text-sm transition hover:border-primary hover:text-primary">
                  {nom(v)}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
