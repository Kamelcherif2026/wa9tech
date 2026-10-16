import type { CategoriePub } from "./requetes";

/** Couleurs de la charte, en alternance (contrastes vérifiés : texte blanc sur foncé, encre sur safran). */
export const TEINTES = [
  "bg-terracotta text-white",
  "bg-bleu text-white",
  "bg-safran text-encre",
  "bg-encre text-sable",
  "bg-[#2e7d6b] text-white", // vert céramique de Nabeul
] as const;

export type Teinte = (typeof TEINTES)[number];

/** Catégorie parente (une sous-catégorie renvoie à sa discipline). */
export function parente(categories: CategoriePub[], id: number | undefined | null) {
  const c = categories.find((x) => x.id === id);
  return c?.parent_id ? categories.find((x) => x.id === c.parent_id) : c;
}

/** Teinte d'une discipline : la même partout (tuiles de l'accueil, en-têtes, fiches). */
export function teinteCategorie(categories: CategoriePub[], id: number | undefined | null): Teinte {
  const p = parente(categories, id);
  const i = categories.filter((c) => c.parent_id === null).findIndex((c) => c.id === p?.id);
  return TEINTES[Math.max(0, i) % TEINTES.length];
}
