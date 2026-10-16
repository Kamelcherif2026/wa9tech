import { ENVIRONNEMENT } from "@/lib/environnement";

/**
 * Point de contrôle pour Railway (healthcheck) : répond dès que le serveur Next.js est prêt.
 * Volontairement sans appel à Supabase, pour qu'une lenteur de la base ne bloque pas un déploiement.
 */
export function GET() {
  return Response.json({
    statut: "ok",
    environnement: ENVIRONNEMENT,
    version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}
