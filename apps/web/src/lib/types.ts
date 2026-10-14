export interface Ville {
  id: number;
  slug: string;
  nom_fr: string;
  nom_ar: string;
  gouvernorat: string;
}

export const TYPES_LIEU = {
  theatre: "Théâtre",
  cinema: "Cinéma",
  salle_concert: "Salle de concert",
  maison_culture: "Maison de la culture",
  centre_culturel: "Centre culturel",
  galerie: "Galerie",
  musee: "Musée",
  cafe_culturel: "Café culturel",
  bar_restaurant: "Bar / Restaurant",
  espace_alternatif: "Espace alternatif",
  plein_air: "Plein air / espace public",
  site_patrimonial: "Site patrimonial",
  hotel: "Hôtel",
  autre: "Autre",
} as const;

export type TypeLieu = keyof typeof TYPES_LIEU;

export interface Lieu {
  id: string;
  slug: string;
  ville_id: number;
  nom: string;
  nom_ar: string | null;
  type: TypeLieu;
  adresse: string | null;
  telephone: string | null;
  lien: string | null;
  lat: number | null;
  lng: number | null;
  actif: boolean;
}

export interface Organisateur {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  telephone: string | null;
  email: string | null;
  lien: string | null;
  logo_url: string | null;
  statut_compte: "non_reclame" | "en_attente" | "valide";
}

/** État renvoyé par les Server Actions de formulaire. */
export interface EtatFormulaire {
  erreur?: string;
  champs?: Record<string, string>;
}
