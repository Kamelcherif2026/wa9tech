import type { Langue } from "@/lib/i18n";

const FUSEAU = "Africa/Tunis";
const locale = (l: Langue) => (l === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");

export function dateCourte(iso: string, l: Langue) {
  return new Intl.DateTimeFormat(locale(l), {
    timeZone: FUSEAU, weekday: "short", day: "numeric", month: "short",
  }).format(new Date(iso));
}

export function heure(iso: string, l: Langue) {
  return new Intl.DateTimeFormat(locale(l), {
    timeZone: FUSEAU, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso));
}

export function dateLongue(iso: string, l: Langue) {
  return new Intl.DateTimeFormat(locale(l), {
    timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(iso));
}

/** Date du jour à Tunis au format AAAA-MM-JJ. */
export function aujourdhuiTunis(maintenant: Date) {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: FUSEAU }).format(maintenant);
}

const versIso = (jour: string, h: string) => new Date(`${jour}T${h}+01:00`).toISOString();
const ajouterJours = (jour: string, n: number) => {
  const d = new Date(`${jour}T12:00:00+01:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return aujourdhuiTunis(d);
};

export type Periode = "" | "aujourdhui" | "demain" | "weekend" | "semaine" | "mois";
export const PERIODES: Periode[] = ["", "aujourdhui", "demain", "weekend", "semaine", "mois"];

/** Fenêtre [début, fin] d'une période, en heure de Tunis. */
export function fenetre(periode: Periode, maintenant: Date): { debut: string; fin: string | null } {
  const jour = aujourdhuiTunis(maintenant);
  const debut = maintenant.toISOString();
  const jourSemaine = new Date(`${jour}T12:00:00+01:00`).getUTCDay(); // 0 = dimanche
  switch (periode) {
    case "aujourdhui":
      return { debut, fin: versIso(jour, "23:59:59") };
    case "demain": {
      const d = ajouterJours(jour, 1);
      return { debut: versIso(d, "00:00:00"), fin: versIso(d, "23:59:59") };
    }
    case "weekend": {
      // Du vendredi 17 h au dimanche soir (si on est déjà le week-end : jusqu'à dimanche)
      const versVendredi = (5 - jourSemaine + 7) % 7;
      const vendredi = jourSemaine === 6 || jourSemaine === 0 ? jour : ajouterJours(jour, versVendredi);
      const dimanche = jourSemaine === 0 ? jour : ajouterJours(jour, (7 - jourSemaine) % 7);
      const debutWe = jourSemaine >= 5 || jourSemaine === 0 ? debut : versIso(vendredi, "17:00:00");
      return { debut: debutWe, fin: versIso(dimanche, "23:59:59") };
    }
    case "semaine":
      return { debut, fin: versIso(ajouterJours(jour, 7), "23:59:59") };
    case "mois":
      return { debut, fin: versIso(ajouterJours(jour, 31), "23:59:59") };
    default:
      return { debut, fin: null };
  }
}
