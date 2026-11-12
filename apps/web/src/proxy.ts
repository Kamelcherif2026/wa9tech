import { NextResponse, type NextRequest } from "next/server";
import { sessionCompte, updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) return updateSession(request);
  if (/^\/(fr|ar)\/(espace|connexion)(\/|$)/.test(pathname) || pathname.startsWith("/auth/")) {
    return sessionCompte(request);
  }

  // Site public : toute URL sans langue est redirigée vers /fr ou /ar
  const langueNavigateur = request.headers.get("accept-language")?.toLowerCase().startsWith("ar") ? "ar" : "fr";
  const url = request.nextUrl.clone();
  url.pathname = `/${langueNavigateur}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Admin et compte (session) + toute URL publique qui ne commence ni par /fr, ni par /ar, ni par un fichier technique
  matcher: [
    "/admin/:path*",
    // Compte (session Supabase) : espace personnel, connexion, retour de Google
    "/fr/espace/:path*", "/ar/espace/:path*", "/fr/connexion", "/ar/connexion", "/auth/:path*",
    "/((?!fr(?:/|$)|ar(?:/|$)|admin|api|_next|sitemap\\.xml|robots\\.txt|favicon\\.ico|.*\\.[a-z0-9]+$).*)",
  ],
};
