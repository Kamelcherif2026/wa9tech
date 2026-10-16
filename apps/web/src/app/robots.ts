import type { MetadataRoute } from "next";
import { EST_PRODUCTION } from "@/lib/environnement";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wa9tech.tn";

export default function robots(): MetadataRoute.Robots {
  // Recette / local : rien n'est indexé (évite les doublons avec le futur wa9tech.tn)
  if (!EST_PRODUCTION) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
