/**
 * Extrait des coordonnées GPS d'un texte collé :
 *  - lien Google Maps (…/@36.80,10.18,17z ou …!3d36.80!4d10.18 ou ?q=36.80,10.18)
 *  - coordonnées simples « 36.80, 10.18 »
 */
export function extraireCoordonnees(texte: string): { lat: number; lng: number } | null {
  const t = texte.trim();
  const motifs = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/,
  ];
  for (const motif of motifs) {
    const m = t.match(motif);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (coordonneesValides(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

/** Vérifie que le point est plausible pour la Tunisie (marge large). */
export function coordonneesValides(lat: number, lng: number): boolean {
  return lat >= 30 && lat <= 38 && lng >= 7 && lng <= 12;
}

export function versEwkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}
