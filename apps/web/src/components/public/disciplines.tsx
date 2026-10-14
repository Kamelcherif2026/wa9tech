import Link from "next/link";
import {
  Baby, Clapperboard, Drama, Footprints, Hammer, Landmark, Mic, Music, Palette, PartyPopper, type LucideIcon,
} from "lucide-react";
import type { CategoriePub } from "@/lib/public/requetes";
import type { Langue } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Etoile, Porte } from "./motifs";

const ICONES: Record<string, LucideIcon> = {
  musique: Music,
  theatre: Drama,
  cinema: Clapperboard,
  "arts-visuels": Palette,
  danse: Footprints,
  festivals: PartyPopper,
  rencontres: Mic,
  ateliers: Hammer,
  patrimoine: Landmark,
  "jeune-public": Baby,
};

/** Couleurs des tuiles, en alternance (contrastes vérifiés : texte blanc sur foncé, encre sur safran). */
const TEINTES = [
  "bg-terracotta text-white",
  "bg-bleu text-white",
  "bg-safran text-encre",
  "bg-encre text-sable",
  "bg-[#2e7d6b] text-white", // vert céramique de Nabeul
];

/** Tuiles illustrées des disciplines (catégories parentes). */
export function Disciplines({ categories, l }: { categories: CategoriePub[]; l: Langue }) {
  const parents = categories.filter((c) => c.parent_id === null);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {parents.map((c, i) => {
        const Icone = ICONES[c.slug] ?? Etoile;
        return (
          <Link
            key={c.slug}
            href={`/${l}/categorie/${c.slug}`}
            className={cn(
              "group motif-zellige relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:h-40 [--motif-opacite:0.12]",
              TEINTES[i % TEINTES.length],
            )}
          >
            <Porte className="absolute -end-6 -bottom-8 h-32 w-24 opacity-20 transition duration-500 group-hover:-rotate-6 group-hover:opacity-30" />
            <Icone className="size-9 transition duration-300 group-hover:scale-110" strokeWidth={1.75} />
            <span className="relative font-[family-name:var(--font-titre)] text-lg leading-tight font-extrabold sm:text-xl">
              {l === "ar" ? c.libelle_ar : c.libelle_fr}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
