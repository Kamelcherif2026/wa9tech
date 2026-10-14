import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/** Client Supabase côté serveur (Server Components, Server Actions, Route Handlers). */
export async function createClient() {
  // Données personnalisées : rendu uniquement au moment de la requête (Cache Components).
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : sans effet, le proxy rafraîchit la session.
          }
        },
      },
    },
  );
}
