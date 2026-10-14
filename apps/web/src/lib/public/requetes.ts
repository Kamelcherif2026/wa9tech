import { cacheLife, cacheTag } from "next/cache";
import { clientPublic } from "@/lib/supabase/public";
import { fenetre, type Periode } from "./dates";

export const TAG = "evenements";

export interface Carte {
  id: string;
  slug: string;
  titre_fr: string;
  titre_ar: string | null;
  image: string | null;
  categorie_id: number;
  ville_id: number | null;
  lieu_nom: string | null;
  prochaine_date: string | null;
  gratuit: boolean;
  prix_min: number | null;
  featured: boolean;
  total?: number;
}

export interface VillePub { id: number; slug: string; nom_fr: string; nom_ar: string; gouvernorat: string }
export interface CategoriePub { id: number; slug: string; parent_id: number | null; libelle_fr: string; libelle_ar: string; ordre: number }

/** Référentiels (villes, catégories) — changent rarement. */
export async function referentiels() {
  "use cache";
  cacheLife("hours");
  cacheTag("referentiels");
  const sb = clientPublic();
  const [villes, categories] = await Promise.all([
    sb.from("ville").select("id, slug, nom_fr, nom_ar, gouvernorat").order("nom_fr"),
    sb.from("categorie").select("id, slug, parent_id, libelle_fr, libelle_ar, ordre").order("ordre"),
  ]);
  return {
    villes: (villes.data ?? []) as VillePub[],
    categories: (categories.data ?? []) as CategoriePub[],
  };
}

export interface Criteres {
  q?: string;
  ville?: string;
  categorie?: string; // slug (parent ou enfant)
  periode?: Periode;
  gratuit?: boolean;
  page?: number;
  parPage?: number;
}

/** Recherche publique (mise en cache quelques minutes, invalidée à chaque publication). */
export async function rechercher(c: Criteres): Promise<{ cartes: Carte[]; total: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG);

  const { categories } = await referentiels();
  const cat = c.categorie ? categories.find((x) => x.slug === c.categorie) : undefined;
  const { debut, fin } = fenetre(c.periode ?? "", new Date());
  const parPage = c.parPage ?? 24;

  const { data, error } = await clientPublic().rpc("rechercher_evenements", {
    p_q: c.q || null,
    p_ville: c.ville || null,
    p_categories: cat ? [cat.id] : null,
    p_debut: debut,
    p_fin: fin,
    p_gratuit: c.gratuit ? true : null,
    p_limite: parPage,
    p_decalage: ((c.page ?? 1) - 1) * parPage,
  });
  if (error) throw new Error(error.message);
  const cartes = (data ?? []) as Carte[];
  return { cartes, total: Number(cartes[0]?.total ?? 0) };
}

/** Sections de la page d'accueil. */
export async function accueil() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG);
  const [aujourdhui, weekend, bientot, locale] = await Promise.all([
    rechercher({ periode: "aujourdhui", parPage: 8 }),
    rechercher({ periode: "weekend", parPage: 8 }),
    rechercher({ periode: "mois", parPage: 12 }),
    rechercher({ categorie: "live", parPage: 8 }),
  ]);
  return {
    aujourdhui: aujourdhui.cartes,
    weekend: weekend.cartes,
    aLaUne: choisirALaUne(bientot.cartes),
    bientot: bientot.cartes,
    sceneLocale: locale.cartes,
  };
}

/**
 * Bandeau « à la une » : les événements mis en avant par l'équipe,
 * complétés si besoin par les prochains événements qui ont une affiche.
 */
function choisirALaUne(cartes: Carte[]) {
  const misEnAvant = cartes.filter((c) => c.featured);
  const complement = cartes.filter((c) => !c.featured && c.image);
  return [...misEnAvant, ...complement].slice(0, 4);
}

/** Nombre d'événements à venir par ville (pour la carte de la page d'accueil). */
export async function compteParVille(): Promise<Record<number, number>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG);
  const { data } = await clientPublic()
    .from("evenement")
    .select("ville_id") // rempli automatiquement depuis le lieu par le trigger
    .eq("statut", "publie")
    .not("prochaine_date", "is", null)
    .limit(5000);
  const comptes: Record<number, number> = {};
  for (const { ville_id } of data ?? []) {
    if (ville_id != null) comptes[ville_id] = (comptes[ville_id] ?? 0) + 1;
  }
  return comptes;
}

export interface Fiche {
  id: string;
  slug: string;
  titre_fr: string;
  titre_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  images: string[];
  gratuit: boolean;
  prix_min: number | null;
  prix_max: number | null;
  infos_reservation: string | null;
  lien_externe: string | null;
  telephone_reservation: string | null;
  lieu_texte: string | null;
  verifie: boolean;
  prochaine_date: string | null;
  modifie_le: string;
  categorie: { id: number; slug: string; libelle_fr: string; libelle_ar: string } | null;
  lieu: { slug: string; nom: string; nom_ar: string | null; adresse: string | null; lat: number | null; lng: number | null } | null;
  ville: { slug: string; nom_fr: string; nom_ar: string } | null;
  organisateur: { nom: string; lien: string | null } | null;
  representations: { debut: string; fin: string | null; annulee: boolean }[];
}

export async function fiche(slug: string): Promise<Fiche | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG, `evenement:${slug}`);
  const { data } = await clientPublic()
    .from("evenement")
    .select(`id, slug, titre_fr, titre_ar, description_fr, description_ar, images, gratuit, prix_min, prix_max,
      infos_reservation, lien_externe, telephone_reservation, lieu_texte, verifie, prochaine_date, modifie_le,
      categorie:categorie_id(id, slug, libelle_fr, libelle_ar),
      lieu:lieu_id(slug, nom, nom_ar, adresse, lat, lng),
      ville:ville_id(slug, nom_fr, nom_ar),
      organisateur:organisateur_id(nom, lien),
      representations:representation(debut, fin, annulee)`)
    .eq("slug", slug)
    .order("debut", { referencedTable: "representation" })
    .maybeSingle();
  return (data as Fiche | null) ?? null;
}

export async function similaires(id: string): Promise<Carte[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG);
  const { data } = await clientPublic().rpc("evenements_similaires", { p_evenement: id, p_limite: 4 });
  return ((data ?? []) as (Carte & { images: string[] })[]).map((e) => ({ ...e, image: e.images?.[0] ?? null, lieu_nom: null }));
}

export async function lieuPublic(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG, "lieux");
  const sb = clientPublic();
  const { data: lieu } = await sb
    .from("lieu")
    .select("id, slug, nom, nom_ar, type, adresse, telephone, lien, lat, lng, ville:ville_id(slug, nom_fr, nom_ar)")
    .eq("slug", slug)
    .maybeSingle();
  if (!lieu) return null;
  const { data: evts } = await sb
    .from("evenement")
    .select("id, slug, titre_fr, titre_ar, images, categorie_id, ville_id, prochaine_date, gratuit, prix_min, featured")
    .eq("lieu_id", lieu.id)
    .eq("statut", "publie")
    .not("prochaine_date", "is", null)
    .order("prochaine_date")
    .limit(48);
  const cartes: Carte[] = (evts ?? []).map((e) => ({ ...e, image: e.images?.[0] ?? null, lieu_nom: lieu.nom }));
  return { lieu: lieu as unknown as {
    id: string; slug: string; nom: string; nom_ar: string | null; type: string; adresse: string | null;
    telephone: string | null; lien: string | null; lat: number | null; lng: number | null;
    ville: { slug: string; nom_fr: string; nom_ar: string } | null;
  }, cartes };
}

/** Données du plan du site. */
export async function pourSitemap() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);
  const sb = clientPublic();
  const [evts, lieux] = await Promise.all([
    sb.from("evenement").select("slug, modifie_le").eq("statut", "publie").limit(5000),
    sb.from("lieu").select("slug").eq("actif", true).limit(2000),
  ]);
  return { evenements: evts.data ?? [], lieux: lieux.data ?? [] };
}
