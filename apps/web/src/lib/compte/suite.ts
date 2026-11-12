/**
 * Adresse de retour après connexion : uniquement une page du site (/fr/… ou /ar/…),
 * jamais un autre domaine (protection contre les redirections malveillantes).
 */
export function suiteSure(suite: string | null | undefined, defaut = "/fr/espace"): string {
  if (!suite || !/^\/(fr|ar)(\/|$)/.test(suite) || suite.startsWith("//") || suite.includes("\\")) return defaut;
  return suite;
}
