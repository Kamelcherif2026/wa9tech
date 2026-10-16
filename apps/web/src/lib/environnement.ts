/**
 * Environnement d'exécution du site : « production » (wa9tech.tn), « staging » (recette Railway) ou « dev » (local).
 * Seule la production est indexée par les moteurs de recherche.
 */
export const ENVIRONNEMENT = (process.env.WA9TECH_ENV ?? "dev") as "production" | "staging" | "dev";
export const EST_PRODUCTION = ENVIRONNEMENT === "production";
