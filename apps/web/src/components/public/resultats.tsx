import Link from "next/link";
import { Gift } from "lucide-react";
import { rechercher, referentiels, type Criteres } from "@/lib/public/requetes";
import { PERIODES, type Periode } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BarreRecherche } from "./barre-recherche";
import { GrilleEvenements } from "./carte-evenement";
import { Etoile } from "./motifs";

type Params = Record<string, string | string[] | undefined>;
const val = (p: Params, k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

/** Lit les filtres de l'URL (les valeurs fixées par la page — ville, catégorie — sont prioritaires). */
export function lireCriteres(p: Params, fixes: Partial<Criteres> = {}): Criteres & { quand: Periode } {
  const quand = (PERIODES as string[]).includes(val(p, "quand") ?? "") ? (val(p, "quand") as Periode) : "";
  return {
    q: val(p, "q")?.trim().slice(0, 100),
    ville: val(p, "ville"),
    categorie: val(p, "categorie"),
    gratuit: val(p, "gratuit") === "1",
    page: Math.max(1, Number(val(p, "page")) || 1),
    ...fixes,
    periode: quand,
    quand,
  };
}

const PASTILLES: Periode[] = ["", "aujourdhui", "demain", "weekend", "semaine"];

export async function Resultats({ l, criteres, base }: { l: Langue; criteres: ReturnType<typeof lireCriteres>; base: string }) {
  const d = t(l);
  const [{ villes, categories }, { cartes, total }] = await Promise.all([referentiels(), rechercher(criteres)]);
  const parPage = 24;
  const pages = Math.max(1, Math.ceil(total / parPage));
  const page = criteres.page ?? 1;

  /** Lien vers la même liste avec certains filtres modifiés (retour à la page 1 sauf indication). */
  const lien = (modif: { quand?: Periode; gratuit?: boolean; page?: number }) => {
    const c = { quand: criteres.quand, gratuit: criteres.gratuit, page: 1, ...modif };
    const q = new URLSearchParams();
    if (criteres.q) q.set("q", criteres.q);
    if (c.quand) q.set("quand", c.quand);
    if (c.gratuit) q.set("gratuit", "1");
    if (criteres.ville && !base.includes("/ville/")) q.set("ville", criteres.ville);
    if (criteres.categorie && !base.includes("/categorie/")) q.set("categorie", criteres.categorie);
    if (c.page > 1) q.set("page", String(c.page));
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  };

  const pastille = (actif: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold transition",
      actif ? "border-encre bg-encre text-sable" : "border-encre/15 bg-card hover:border-encre",
    );

  return (
    <div className="relative -mt-8">
      <BarreRecherche
        l={l}
        villes={villes}
        categories={categories}
        action={`/${l}/evenements`}
        valeurs={{ q: criteres.q, ville: criteres.ville, quand: criteres.quand, categorie: criteres.categorie, gratuit: criteres.gratuit }}
      />

      {/* Filtres rapides */}
      <nav className="mt-6 flex flex-wrap items-center gap-2" aria-label={d.quand}>
        {PASTILLES.map((p) => (
          <Link key={p || "tout"} href={lien({ quand: p })} className={pastille(criteres.quand === p)} aria-current={criteres.quand === p}>
            {d.quandOptions[p]}
          </Link>
        ))}
        <Link href={lien({ gratuit: !criteres.gratuit })} className={pastille(!!criteres.gratuit)} aria-pressed={!!criteres.gratuit}>
          <Gift className="size-4" /> {d.gratuit}
        </Link>
      </nav>

      <p className="mt-6 mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Etoile className="size-3.5 text-safran" /> {d.resultats(total)}
      </p>
      {cartes.length ? (
        <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />
      ) : (
        <div className="motif-zellige rounded-3xl border-2 border-dashed border-encre/15 bg-card p-10 text-center text-muted-foreground [--motif-opacite:0.05]">
          <p className="font-[family-name:var(--font-titre)] text-5xl font-extrabold text-safran">؟</p>
          <p className="mt-3">{d.aucunResultat}</p>
          {(criteres.quand || criteres.gratuit) && (
            <Link href={lien({ quand: "", gratuit: false })} className="mt-4 inline-block font-semibold text-primary hover:underline">
              {d.voirTout}
            </Link>
          )}
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm" aria-label="pagination">
          {page > 1 && <Link className={pastille(false)} href={lien({ page: page - 1 })}>{d.precedent}</Link>}
          <span className="font-semibold tabular-nums">{page} / {pages}</span>
          {page < pages && <Link className={pastille(false)} href={lien({ page: page + 1 })}>{d.suivant}</Link>}
        </nav>
      )}
    </div>
  );
}

export function ChargementResultats() {
  return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />;
}
