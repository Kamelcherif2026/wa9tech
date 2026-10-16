import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { formaterDate } from "@/lib/dates";
import { FormulaireArtiste } from "../formulaire";
import { fusionnerArtiste, supprimerArtiste } from "../actions";

export default function ModifierArtiste({ params, searchParams }: PageProps<"/admin/artistes/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ params, searchParams }: { params: PageProps<"/admin/artistes/[id]">["params"]; searchParams: PageProps<"/admin/artistes/[id]">["searchParams"] }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: artiste } = await supabase.from("artiste").select("id, slug, nom, nom_ar, lien").eq("id", id).maybeSingle();
  if (!artiste) notFound();

  const [{ data: liens }, { data: proches }] = await Promise.all([
    supabase
      .from("evenement_artiste")
      .select("evenement:evenement_id(id, titre_fr, statut, prochaine_date)")
      .eq("artiste_id", id)
      .returns<{ evenement: { id: string; titre_fr: string; statut: string; prochaine_date: string | null } | null }[]>(),
    supabase.rpc("rechercher_artistes", { p_q: artiste.nom, p_limite: 10 }),
  ]);
  const doublonsPossibles = ((proches ?? []) as { id: string; nom: string; nb_evenements: number }[]).filter((a) => a.id !== id);

  const message =
    sp.ok ? { ok: true, texte: "Modifications enregistrées." }
    : sp.fusion ? { ok: true, texte: "Doublon fusionné dans cet artiste." }
    : typeof sp.erreur === "string" ? { ok: false, texte: sp.erreur }
    : null;

  return (
    <>
      <EntetePage
        titre={artiste.nom}
        description={`Page publique : /fr/artiste/${artiste.slug}`}
        actions={
          <form action={supprimerArtiste}>
            <input type="hidden" name="id" value={artiste.id} />
            <Button type="submit" variant="destructive" size="lg">Supprimer</Button>
          </form>
        }
      />
      {message && (
        <p className={`mb-4 max-w-2xl rounded-lg border px-4 py-3 text-sm ${message.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {message.texte}
        </p>
      )}

      <div className="grid max-w-2xl gap-6">
        <FormulaireArtiste artiste={artiste} />

        <Card>
          <CardHeader><CardTitle>Événements ({liens?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {liens?.length ? (
              <ul className="space-y-1 text-sm">
                {liens.map((l) => l.evenement && (
                  <li key={l.evenement.id} className="flex justify-between gap-4">
                    <Link href={`/admin/evenements/${l.evenement.id}`} className="hover:text-primary">{l.evenement.titre_fr}</Link>
                    <span className="whitespace-nowrap text-muted-foreground">{formaterDate(l.evenement.prochaine_date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun événement lié.</p>
            )}
          </CardContent>
        </Card>

        {doublonsPossibles.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Doublon ?</CardTitle></CardHeader>
            <CardContent>
              <form action={fusionnerArtiste} className="flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={artiste.id} />
                <span>Cet artiste est un doublon de</span>
                <NativeSelect name="garde" className="max-w-64" defaultValue="">
                  <option value="" disabled>Choisir…</option>
                  {doublonsPossibles.map((a) => (
                    <option key={a.id} value={a.id}>{a.nom} ({a.nb_evenements} évén.)</option>
                  ))}
                </NativeSelect>
                <Button type="submit" variant="outline">Fusionner</Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">Ses événements passent à l&apos;artiste choisi, puis cette fiche est supprimée.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
