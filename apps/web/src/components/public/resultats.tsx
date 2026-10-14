import Link from "next/link";
import { rechercher, referentiels, type Criteres } from "@/lib/public/requetes";
import { PERIODES, type Periode } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";
import { BarreRecherche } from "./barre-recherche";
import { GrilleEvenements } from "./carte-evenement";

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

export async function Resultats({ l, criteres, base }: { l: Langue; criteres: ReturnType<typeof lireCriteres>; base: string }) {
  const d = t(l);
  const [{ villes, categories }, { cartes, total }] = await Promise.all([referentiels(), rechercher(criteres)]);
  const parPage = 24;
  const pages = Math.max(1, Math.ceil(total / parPage));
  const lienPage = (n: number) => {
    const q = new URLSearchParams();
    if (criteres.q) q.set("q", criteres.q);
    if (criteres.quand) q.set("quand", criteres.quand);
    if (criteres.gratuit) q.set("gratuit", "1");
    if (criteres.ville && !base.includes("/ville/")) q.set("ville", criteres.ville);
    if (criteres.categorie && !base.includes("/categorie/")) q.set("categorie", criteres.categorie);
    if (n > 1) q.set("page", String(n));
    return `${base}?${q}`;
  };

  return (
    <>
      <BarreRecherche
        l={l}
        villes={villes}
        categories={categories}
        action={`/${l}/evenements`}
        valeurs={{ q: criteres.q, ville: criteres.ville, quand: criteres.quand, categorie: criteres.categorie, gratuit: criteres.gratuit }}
      />
      <p className="mt-6 mb-3 text-sm text-muted-foreground">{d.resultats(total)}</p>
      {cartes.length ? (
        <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />
      ) : (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{d.aucunResultat}</p>
      )}
      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="pagination">
          {(criteres.page ?? 1) > 1 && <Link className="rounded-lg border px-3 py-2 hover:bg-muted" href={lienPage((criteres.page ?? 1) - 1)}>{d.precedent}</Link>}
          <span>{criteres.page} / {pages}</span>
          {(criteres.page ?? 1) < pages && <Link className="rounded-lg border px-3 py-2 hover:bg-muted" href={lienPage((criteres.page ?? 1) + 1)}>{d.suivant}</Link>}
        </nav>
      )}
    </>
  );
}

export function ChargementResultats() {
  return <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />;
}
