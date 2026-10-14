import { Search } from "lucide-react";
import type { CategoriePub, VillePub } from "@/lib/public/requetes";
import { PERIODES } from "@/lib/public/dates";
import { t, type Langue } from "@/lib/i18n";

/** Formulaire GET sans JavaScript : fonctionne même sur un téléphone ancien ou en 3G. */
export function BarreRecherche({
  l,
  villes,
  categories,
  valeurs = {},
  action,
}: {
  l: Langue;
  villes: VillePub[];
  categories: CategoriePub[];
  valeurs?: { q?: string; ville?: string; quand?: string; categorie?: string; gratuit?: boolean };
  action?: string;
}) {
  const d = t(l);
  const champ =
    "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";
  const parents = categories.filter((c) => c.parent_id === null);

  return (
    <form action={action ?? `/${l}/evenements`} className="grid gap-2 rounded-2xl border-2 border-encre bg-card p-3 shadow-[5px_5px_0_var(--encre)] sm:grid-cols-[2fr_1fr_1fr_auto] rtl:shadow-[-5px_5px_0_var(--encre)]">
      <label className="sr-only" htmlFor="q">{d.quoi}</label>
      <input id="q" name="q" type="search" placeholder={d.quoi} defaultValue={valeurs.q} className={champ} />

      <label className="sr-only" htmlFor="ville">{d.ou}</label>
      <select id="ville" name="ville" defaultValue={valeurs.ville ?? ""} className={champ}>
        <option value="">{d.partout}</option>
        {villes.map((v) => (
          <option key={v.slug} value={v.slug}>{l === "ar" ? v.nom_ar : v.nom_fr}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="quand">{d.quand}</label>
      <select id="quand" name="quand" defaultValue={valeurs.quand ?? ""} className={champ}>
        {PERIODES.map((p) => (
          <option key={p} value={p}>{d.quandOptions[p]}</option>
        ))}
      </select>

      <button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-bold text-primary-foreground transition hover:bg-encre">
        <Search className="size-5" /> {d.rechercher}
      </button>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
        <label className="sr-only" htmlFor="categorie">{d.categorie}</label>
        <select id="categorie" name="categorie" defaultValue={valeurs.categorie ?? ""} className="h-9 rounded-lg border border-input bg-card px-2 text-sm">
          <option value="">{d.categorie} : {d.toutes}</option>
          {parents.map((p) => (
            <optgroup key={p.id} label={l === "ar" ? p.libelle_ar : p.libelle_fr}>
              <option value={p.slug}>{l === "ar" ? p.libelle_ar : p.libelle_fr}</option>
              {categories.filter((c) => c.parent_id === p.id).map((c) => (
                <option key={c.slug} value={c.slug}>{l === "ar" ? c.libelle_ar : c.libelle_fr}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="gratuit" value="1" defaultChecked={valeurs.gratuit} className="size-4" />
          {d.gratuitSeulement}
        </label>
      </div>
    </form>
  );
}
