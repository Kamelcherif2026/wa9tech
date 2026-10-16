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

export interface Categorie {
  id: number;
  slug: string;
  parent_id: number | null;
  libelle_fr: string;
  libelle_ar: string;
  ordre: number;
}

export const STATUTS_EVENEMENT = {
  brouillon: { libelle: "Brouillon", variante: "neutre" },
  en_attente: { libelle: "En attente", variante: "alerte" },
  publie: { libelle: "Publié", variante: "succes" },
  rejete: { libelle: "Rejeté", variante: "danger" },
  expire: { libelle: "Expiré", variante: "neutre" },
  archive: { libelle: "Archivé", variante: "neutre" },
} as const;

export type StatutEvenement = keyof typeof STATUTS_EVENEMENT;

export const PORTEES = {
  locale: "Locale",
  nationale: "Nationale",
  internationale: "Internationale",
} as const;

export interface Representation {
  id?: string;
  debut: string; // ISO
  fin: string | null;
  annulee?: boolean;
}

export interface Evenement {
  id: string;
  slug: string;
  organisateur_id: string | null;
  lieu_id: string | null;
  lieu_texte: string | null;
  ville_id: number | null;
  categorie_id: number;
  titre_fr: string;
  titre_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  images: string[];
  prix_min: number | null;
  prix_max: number | null;
  gratuit: boolean;
  infos_reservation: string | null;
  lien_externe: string | null;
  telephone_reservation: string | null;
  portee: keyof typeof PORTEES;
  source: string;
  statut: StatutEvenement;
  motif_rejet: string | null;
  prochaine_date: string | null;
  representations?: Representation[];
  artistes?: { ordre: number; artiste: { id: string; nom: string; nom_ar: string | null } | null }[];
}
