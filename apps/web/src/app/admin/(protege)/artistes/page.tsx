import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PageArtistes({ searchParams }: PageProps<"/admin/artistes">) {
  return (
    <>
      <EntetePage
        titre="Artistes"
        description="Créés depuis les fiches d'événements (sélecteur ou lecture IA). Corrigez ici les noms et fusionnez les doublons."
      />
      <Suspense fallback={<Chargement />}>
        <Liste searchParams={searchParams} />
      </Suspense>
    </>
  );
}

interface Ligne {
  id: string;
  nom: string;
  nom_ar: string | null;
  evenement_artiste: { count: number }[];
}

async function Liste({ searchParams }: { searchParams: PageProps<"/admin/artistes">["searchParams"] }) {
  const p = await searchParams;
  const q = typeof p.q === "string" ? p.q.trim() : "";
  const supabase = await createClient();

  let lignes: Ligne[] = [];
  if (q) {
    // Recherche approximative (accents, arabe) via la fonction SQL
    const { data } = await supabase.rpc("rechercher_artistes", { p_q: q, p_limite: 20 });
    lignes = ((data ?? []) as { id: string; nom: string; nom_ar: string | null; nb_evenements: number }[]).map((a) => ({
      ...a,
      evenement_artiste: [{ count: a.nb_evenements }],
    }));
  } else {
    const { data } = await supabase.from("artiste").select("id, nom, nom_ar, evenement_artiste(count)").order("nom").limit(300).returns<Ligne[]>();
    lignes = data ?? [];
  }

  return (
    <div className="space-y-4">
      {p.supprime && <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">Artiste supprimé.</p>}
      <form className="flex gap-2">
        <Input name="q" placeholder="Rechercher un artiste…" defaultValue={q} className="max-w-xs" />
        <Button type="submit" variant="outline" size="lg">Rechercher</Button>
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Nom en arabe</th>
              <th className="px-4 py-2 text-right font-medium">Événements</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Aucun artiste.</td></tr>
            )}
            {lignes.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-4 py-2"><Link href={`/admin/artistes/${a.id}`} className="font-medium hover:text-primary">{a.nom}</Link></td>
                <td className="px-4 py-2" dir="rtl">{a.nom_ar}</td>
                <td className="px-4 py-2 text-right tabular-nums">{a.evenement_artiste[0]?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
