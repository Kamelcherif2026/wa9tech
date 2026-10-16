import { createClient as creer } from "@supabase/supabase-js";

/**
 * Client « service » : contourne la RLS. À n'utiliser QUE côté serveur
 * (Server Actions, Route Handlers, after()), jamais dans un composant client.
 * La clé secrète n'a pas de préfixe NEXT_PUBLIC_ : Next.js ne l'envoie jamais au navigateur.
 */
export function clientAdmin() {
  const cle = process.env.SUPABASE_SECRET_KEY;
  if (!cle) throw new Error("SUPABASE_SECRET_KEY manquante (clé secrète Supabase) : .env.local en local, onglet Variables sur Railway.");
  return creer(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
