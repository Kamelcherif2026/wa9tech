import type { NextConfig } from "next";

const production = process.env.WA9TECH_ENV === "production";

/** En-têtes de sécurité appliqués à toutes les pages. */
const ENTETES_SECURITE = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1", "172.22.155.140"],
  experimental: {
    // Formulaire « Proposer un événement » : affiche jusqu'à 3 Mo (+ marge multipart)
    serverActions: { bodySizeLimit: "4mb" },
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...ENTETES_SECURITE,
          // Recette : jamais indexée par Google, même si un lien circule
          ...(production ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
