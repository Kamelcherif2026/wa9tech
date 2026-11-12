import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, LogOut, ShieldCheck } from "lucide-react";
import { langue } from "@/lib/public/langue";
import { t, type Langue } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { BandeauPage } from "@/components/public/bandeau-page";
import { seDeconnecterPublic } from "./actions";

// Page personnelle : jamais en cache, pas de navigation instantanée
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const d = t(await langue());
  return { title: d.espaceTitre, robots: { index: false } };
}

export default async function PageEspace() {
  const l = await langue();
  const d = t(l);
  return (
    <>
      <BandeauPage surtitre={d.monCompte} titre={d.espaceTitre} teinte="bg-encre text-sable" />
      <div className="mt-10">
        <Suspense fallback={<p className="text-muted-foreground">…</p>}>
          <Contenu l={l} />
        </Suspense>
      </div>
    </>
  );
}

async function Contenu({ l }: { l: Langue }) {
  const d = t(l);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect(`/${l}/connexion?suite=/${l}/espace`);

  const { data: profil } = await supabase
    .from("profil")
    .select("nom, role, organisateur:organisateur_id(nom, statut_compte, confiance)")
    .eq("id", claims.sub)
    .maybeSingle<{
      nom: string | null;
      role: string;
      organisateur: { nom: string; statut_compte: string; confiance: boolean } | null;
    }>();

  const nom = profil?.nom || (claims.user_metadata as { full_name?: string } | undefined)?.full_name || (claims.email as string);
  const staff = profil?.role === "admin" || profil?.role === "moderateur";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="space-y-6">
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <p className="text-2xl font-extrabold">{d.bonjour} {nom}</p>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{claims.email as string}</p>
        </div>

        {profil?.organisateur ? (
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
            <p className="flex items-center gap-2 text-sm font-bold text-primary"><Building2 className="size-4" /> {d.maStructure}</p>
            <p className="mt-2 text-xl font-extrabold">{profil.organisateur.nom}</p>
            <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{d.bientotDisponible}</p>
          </div>
        ) : (
          <div className="motif-zellige rounded-3xl bg-terracotta p-6 text-white [--motif-opacite:0.1]">
            <p className="text-xl font-extrabold">{d.devenirOrganisateur}</p>
            <p className="mt-2 max-w-xl opacity-90">{d.devenirOrganisateurTexte}</p>
            <p className="mt-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">{d.bientotDisponible}</p>
          </div>
        )}
      </section>

      <aside className="space-y-3">
        {staff && (
          <Link href="/admin" className="flex items-center gap-3 rounded-2xl bg-card p-4 font-semibold ring-1 ring-border transition hover:ring-primary">
            <ShieldCheck className="size-5 text-primary" /> {d.accesBackOffice}
          </Link>
        )}
        <form action={seDeconnecterPublic}>
          <input type="hidden" name="langue" value={l} />
          <button type="submit" className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-start font-semibold ring-1 ring-border transition hover:ring-destructive">
            <LogOut className="size-5 text-muted-foreground" /> {d.seDeconnecter}
          </button>
        </form>
      </aside>
    </div>
  );
}
