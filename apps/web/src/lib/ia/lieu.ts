/** Clé de comparaison : minuscules, sans accents, sans ponctuation ni espaces superflus. */
function cle(segment: string) {
  return segment
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Assemble le texte du lieu à partir des champs lus par l'IA (lieu_nom, adresse…)
 * en supprimant les morceaux répétés.
 * Ex. « Théâtre des Jeunes Créateurs, Cité de la Culture » + « Cité de la Culture, Tunis »
 *   → « Théâtre des Jeunes Créateurs, Cité de la Culture, Tunis ».
 */
export function composerLieuTexte(...parties: (string | null | undefined)[]): string | null {
  const segments = parties
    .flatMap((p) => (p ?? "").split(/[,،\n]/))
    .map((s) => s.trim())
    .filter(Boolean);

  const gardes: { texte: string; cle: string }[] = [];
  for (const texte of segments) {
    const k = cle(texte);
    if (!k) continue;
    // Déjà présent, ou inclus dans un morceau gardé : on ignore
    if (gardes.some((g) => g.cle === k || g.cle.includes(k))) continue;
    // Le nouveau morceau contient un morceau gardé plus court : on le remplace
    const i = gardes.findIndex((g) => k.includes(g.cle));
    if (i >= 0) gardes[i] = { texte, cle: k };
    else gardes.push({ texte, cle: k });
  }
  const enArabe = gardes.every((g) => /[؀-ۿ]/.test(g.texte));
  return gardes.map((g) => g.texte).join(enArabe ? "، " : ", ") || null;
}
