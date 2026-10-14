import { createClient as creer } from "@supabase/supabase-js";

/**
 * Client anonyme sans session ni cookies, pour les pages publiques mises en cache.
 * La sécurité reste assurée par la RLS : il ne voit que les événements publiés.
 */
export function clientPublic() {
  return creer(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
