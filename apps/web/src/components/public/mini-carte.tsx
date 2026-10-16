import { CARTE_HAUTEUR, CARTE_LARGEUR, CONTOUR_TUNISIE, POSITIONS_VILLES } from "@/lib/public/carte-tunisie";

/** Silhouette de la Tunisie avec la ville mise en évidence (décor des en-têtes de ville). */
export function MiniCarte({ ville, className }: { ville: string; className?: string }) {
  const pos = POSITIONS_VILLES[ville];
  return (
    <svg viewBox={`0 0 ${CARTE_LARGEUR} ${CARTE_HAUTEUR}`} className={className} direction="ltr">
      <path d={CONTOUR_TUNISIE} fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3" strokeLinejoin="round" />
      {pos && (
        <>
          <circle cx={pos[0]} cy={pos[1]} r="16" fill="var(--safran)" opacity="0.35">
            <animate attributeName="r" values="12;22;12" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={pos[0]} cy={pos[1]} r="9" fill="var(--safran)" stroke="white" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
