import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suiteSure } from "@/lib/compte/suite";

/**
 * Retour de Google ou du lien reçu par e-mail : Supabase envoie un code à usage unique,
 * échangé ici contre une session (cookies), puis retour à la page demandée.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Derrière l'hébergeur, l'adresse interne de la requête n'est pas celle du site : on préfère l'adresse publique
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const code = searchParams.get("code");
  const suite = suiteSure(searchParams.get("suite"));
  const langue = suite.startsWith("/ar") ? "ar" : "fr";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(suite, origin));
    console.warn("[auth/callback] échange du code impossible :", error.message);
  }
  return NextResponse.redirect(new URL(`/${langue}/connexion?erreur=1&suite=${encodeURIComponent(suite)}`, origin));
}
