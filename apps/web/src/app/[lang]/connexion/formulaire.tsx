"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface LibellesConnexion {
  continuerGoogle: string;
  ou: string;
  votreEmail: string;
  recevoirLien: string;
  lienEnvoye: string;
  erreurConnexion: string;
  emailInvalide: string;
  conditions: string;
}

/** Logo « G » de Google (couleurs officielles, exigées par Google pour ce bouton). */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function FormulaireConnexionPublique({
  suite,
  erreurInitiale,
  libelles: t,
}: {
  suite: string;
  erreurInitiale?: string;
  libelles: LibellesConnexion;
}) {
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState<"google" | "email" | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState(erreurInitiale);

  const retour = () => `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite)}`;

  async function google() {
    setEnCours("google");
    setErreur(undefined);
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: retour() } });
    if (error) {
      setErreur(t.erreurConnexion);
      setEnCours(null);
    }
    // Sinon le navigateur part chez Google
  }

  async function lienParEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErreur(t.emailInvalide);
      return;
    }
    setEnCours("email");
    setErreur(undefined);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: retour(), shouldCreateUser: true },
    });
    setEnCours(null);
    if (error) setErreur(t.erreurConnexion);
    else setEnvoye(true);
  }

  return (
    <div className="space-y-5 rounded-3xl border-2 border-encre bg-card p-6 shadow-[6px_6px_0_var(--encre)] rtl:shadow-[-6px_6px_0_var(--encre)] sm:p-8">
      <button
        type="button"
        onClick={google}
        disabled={enCours !== null}
        className="flex h-13 w-full items-center justify-center gap-3 rounded-full border-2 border-encre bg-white px-5 text-base font-bold text-encre transition hover:bg-encre/5 disabled:opacity-60"
      >
        {enCours === "google" ? <Loader2 className="size-5 animate-spin" /> : <LogoGoogle />}
        {t.continuerGoogle}
      </button>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> {t.ou} <span className="h-px flex-1 bg-border" />
      </div>

      {envoye ? (
        <p role="status" className="flex items-start gap-3 rounded-xl bg-success/10 p-4 text-sm font-semibold text-success">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> {t.lienEnvoye}
        </p>
      ) : (
        <form onSubmit={lienParEmail} className="space-y-3">
          <label htmlFor="email" className="block text-sm font-bold">{t.votreEmail}</label>
          <input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <button
            type="submit"
            disabled={enCours !== null}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground transition hover:bg-encre disabled:opacity-60"
          >
            {enCours === "email" ? <Loader2 className="size-5 animate-spin" /> : <Mail className="size-5" />}
            {t.recevoirLien}
          </button>
        </form>
      )}

      {erreur && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{erreur}</p>
      )}
      <p className="text-xs text-muted-foreground">{t.conditions}</p>
    </div>
  );
}
