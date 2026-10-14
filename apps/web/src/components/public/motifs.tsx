/** Éléments décoratifs de la charte « affiche tunisienne ». Purement visuels (aria-hidden). */

/** Étoile à huit branches (khatam), motif récurrent du zellige. */
export function Etoile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <rect x="5" y="5" width="14" height="14" />
      <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
    </svg>
  );
}

/** Contour d'une porte en arc, avec ses clous, en filigrane. */
export function Porte({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M6 178V60a54 54 0 0 1 108 0v118" />
      <path d="M22 178V64a38 38 0 0 1 76 0v114" />
      {[40, 60, 80].map((x) =>
        [90, 115, 140].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor" stroke="none" />),
      )}
      <circle cx="60" cy="52" r="7" />
    </svg>
  );
}
