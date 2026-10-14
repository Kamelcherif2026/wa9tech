/** La Tunisie est en UTC+1 toute l'année (pas d'heure d'été). */
export const FUSEAU = "Africa/Tunis";
const DECALAGE = "+01:00";

/** « 2026-11-02T20:30 » (champ datetime-local, heure de Tunis) → ISO avec fuseau. */
export function localVersIso(valeur: string): string {
  return `${valeur}:00${DECALAGE}`;
}

/** ISO → « 2026-11-02T20:30 » en heure de Tunis, pour un champ datetime-local. */
export function isoVersLocal(iso: string): string {
  const parties = new Intl.DateTimeFormat("fr-CA", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(parties.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Affichage lisible : « dim. 2 nov. 2026, 20:30 ». */
export function formaterDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
