import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase (cookies) et indique si l'utilisateur est connecté.
 * Utilisé pour le back-office et pour les pages de compte du site.
 */
export async function rafraichirSession(request: NextRequest) {
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
  return { connecte: Boolean(data?.claims), response: () => response };
}

/** Redirection qui conserve les cookies de session rafraîchis. */
export function rediriger(depuis: NextResponse, url: URL) {
  const r = NextResponse.redirect(url);
  depuis.cookies.getAll().forEach((c) => r.cookies.set(c));
  return r;
}

/**
 * Back-office : rafraîchit la session à chaque requête /admin
 * et redirige vers /admin/login si l'utilisateur n'est pas connecté.
 */
export async function updateSession(request: NextRequest) {
  const { connecte, response } = await rafraichirSession(request);

  const chemin = request.nextUrl.pathname;
  const pageLogin = chemin.startsWith("/admin/login");

  if (!connecte && !pageLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?suite=${encodeURIComponent(chemin)}`;
    return rediriger(response(), url);
  }

  if (connecte && pageLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return rediriger(response(), url);
  }

  return response();
}

/**
 * Espace personnel du site (/fr/espace, /ar/espace) : connexion obligatoire.
 * Page de connexion et retour de Google (/auth/…) : session rafraîchie seulement.
 */
export async function sessionCompte(request: NextRequest) {
  const { connecte, response } = await rafraichirSession(request);
  const chemin = request.nextUrl.pathname;
  const espace = /^\/(fr|ar)\/espace(\/|$)/.exec(chemin);
  if (espace && !connecte) {
    const url = request.nextUrl.clone();
    url.pathname = `/${espace[1]}/connexion`;
    url.search = `?suite=${encodeURIComponent(chemin + request.nextUrl.search)}`;
    return rediriger(response(), url);
  }
  return response();
}
