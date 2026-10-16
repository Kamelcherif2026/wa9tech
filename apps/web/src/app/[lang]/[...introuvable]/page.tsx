import { notFound } from "next/navigation";

// Cette page ne rend jamais de contenu (toujours 404) : pas de validation de navigation instantanée.
export const instant = false;

/** Toute adresse inconnue sous /fr ou /ar affiche la page 404 du site (avec en-tête et pied de page). */
export default function PageInconnue() {
  notFound();
}
