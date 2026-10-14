import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WA9TECH — L'agenda culturel de la Tunisie",
    short_name: "WA9TECH",
    description: "Concerts, théâtre, expos, cinéma, festivals et lives partout en Tunisie.",
    start_url: "/fr",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#B5452B",
    icons: [
      { src: "/marque/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/marque/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/marque/icone-app-wa9tech.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
