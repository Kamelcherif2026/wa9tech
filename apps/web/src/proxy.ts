import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) return updateSession(request);

  // Site public : toute URL sans langue est redirigée vers /fr ou /ar
  const langueNavigateur = request.headers.get("accept-language")?.toLowerCase().startsWith("ar") ? "ar" : "fr";
  const url = request.nextUrl.clone();
  url.pathname = `/${langueNavigateur}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Admin (session) + toute URL publique qui ne commence ni par /fr, ni par /ar, ni par un fichier technique
  matcher: ["/admin/:path*", "/((?!fr(?:/|$)|ar(?:/|$)|admin|api|_next|sitemap\\.xml|robots\\.txt|favicon\\.ico|.*\\.[a-z0-9]+$).*)"],
};
