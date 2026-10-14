import type { MetadataRoute } from "next";
import { pourSitemap, referentiels } from "@/lib/public/requetes";
import { LANGUES } from "@/lib/i18n";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wa9tech.tn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ evenements, lieux }, { villes, categories }] = await Promise.all([pourSitemap(), referentiels()]);
  const entree = (chemin: string, priorite: number, modif?: string): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}/fr${chemin}`,
    lastModified: modif,
    priority: priorite,
    alternates: { languages: Object.fromEntries(LANGUES.map((l) => [l, `${SITE}/${l}${chemin}`])) },
  });
  return [
    entree("", 1),
    entree("/evenements", 0.9),
    ...villes.map((v) => entree(`/ville/${v.slug}`, 0.8)),
    ...categories.map((c) => entree(`/categorie/${c.slug}`, 0.7)),
    ...evenements.map((e) => entree(`/evenement/${e.slug}`, 0.8, e.modifie_le)),
    ...lieux.map((x) => entree(`/lieu/${x.slug}`, 0.6)),
  ];
}
