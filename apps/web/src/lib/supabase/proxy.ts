import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase à chaque requête /admin
 * et redirige vers /admin/login si l'utilisateur n'est pas connecté.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([cle, valeur]) =>
            response.headers.set(cle, valeur),
          );
        },
      },
    },
  );

  // Ne rien placer entre createServerClient et getClaims (recommandation Supabase).
  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims);

  const chemin = request.nextUrl.pathname;
  const pageLogin = chemin.startsWith("/admin/login");

  if (!connecte && !pageLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?suite=${encodeURIComponent(chemin)}`;
    return NextResponse.redirect(url);
  }

  if (connecte && pageLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
