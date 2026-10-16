import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormulaireEvenement } from "../formulaire";
import { chargerOptions } from "../donnees";
import { changerStatut, dupliquerEvenement, publierEvenement, rejeterEvenement } from "../actions";
import { STATUTS_EVENEMENT, type Evenement } from "@/lib/types";

const TEXTES_ALERTES: Record<string, string> = {
  lieu: "Lieu non reconnu dans la base : choisissez-le dans la liste ou créez-le.",
  date: "Aucune date trouvée sur l'affiche : ajoutez-la.",
  heure: "Heure absente de l'affiche : 20:00 a été mis par défaut.",
  annee: "Année absente de l'affiche : l'IA a déduit l'année, vérifiez-la.",
  hors_tunisie: "L'événement semble avoir lieu hors de Tunisie.",
  confiance: "Lecture peu sûre (affiche difficile) : vérifiez tout attentivement.",
};

export default function FicheEvenement({ params, searchParams }: PageProps<"/admin/evenements/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/evenements/[id]">["params"];
  searchParams: PageProps<"/admin/evenements/[id]">["searchParams"];
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: evenement }, options] = await Promise.all([
    supabase
      .from("evenement")
      .select("*, representations:representation(id, debut, fin, annulee), artistes:evenement_artiste(ordre, artiste:artiste_id(id, nom, nom_ar))")
      .eq("id", id)
      .order("debut", { referencedTable: "representation" })
      .maybeSingle<Evenement>(),
    chargerOptions(),
  ]);
  if (!evenement) notFound();

  const s = STATUTS_EVENEMENT[evenement.statut];
  const alertes = typeof sp.alertes === "string" ? sp.alertes.split(",") : [];
  const doublon = typeof sp.doublon === "string" ? sp.doublon : null;
  const message =
    sp.publie ? { ok: true, texte: "Événement publié." }
    : sp.duplique ? { ok: true, texte: "Copie créée (sans les dates) : ajoutez les nouvelles dates puis enregistrez." }
    : sp.ok ? { ok: true, texte: "Modifications enregistrées." }
    : typeof sp.erreur === "string" ? { ok: false, texte: sp.erreur }
    : null;

  return (
    <>
      <EntetePage
        titre={evenement.titre_fr}
        description={evenement.motif_rejet && evenement.statut === "rejete" ? `Motif du rejet : ${evenement.motif_rejet}` : undefined}
        actions={<Badge variante={s.variante} className="h-7 px-3 text-sm">{s.libelle}</Badge>}
      />

      {message && (
        <p className={`mb-4 max-w-4xl rounded-lg border px-4 py-3 text-sm ${message.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {message.texte}
        </p>
      )}

      {typeof sp.import === "string" && (
        <div className="mb-4 max-w-4xl rounded-lg border border-primary/30 bg-accent px-4 py-3 text-sm text-accent-foreground">
          <p className="font-medium">
            Fiche pré-remplie par l&apos;IA ({sp.import}{typeof sp.confiance === "string" ? `, confiance ${sp.confiance} %` : ""}).
            Vérifiez chaque champ avant de publier.
          </p>
          {alertes.length > 0 && (
            <ul className="mt-2 list-disc ps-5">
              {alertes.map((a) => <li key={a}>{TEXTES_ALERTES[a] ?? a}</li>)}
            </ul>
          )}
          {doublon && (
            <p className="mt-2 font-medium text-destructive">
              Doublon possible :{" "}
              <Link href={`/admin/evenements/${doublon}`} className="underline">voir l&apos;événement existant</Link>.
            </p>
          )}
        </div>
      )}

      {/* Barre d'actions de modération */}
      <div className="mb-6 flex max-w-4xl flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        {evenement.statut !== "publie" && (
          <form action={publierEvenement}>
            <input type="hidden" name="id" value={evenement.id} />
            <Button type="submit" size="lg">Publier</Button>
          </form>
        )}
        <form action={dupliquerEvenement}>
          <input type="hidden" name="id" value={evenement.id} />
          <Button type="submit" variant="outline" size="lg">Dupliquer</Button>
        </form>
        {evenement.statut === "publie" && (
          <form action={changerStatut}>
            <input type="hidden" name="id" value={evenement.id} />
            <input type="hidden" name="statut" value="brouillon" />
            <Button type="submit" variant="outline" size="lg">Dépublier</Button>
          </form>
        )}
        {evenement.statut !== "archive" && (
          <form action={changerStatut}>
            <input type="hidden" name="id" value={evenement.id} />
            <input type="hidden" name="statut" value="archive" />
            <Button type="submit" variant="ghost" size="lg">Archiver</Button>
          </form>
        )}
        {(evenement.statut === "en_attente" || evenement.statut === "brouillon") && (
          <form action={rejeterEvenement} className="ml-auto flex gap-2">
            <input type="hidden" name="id" value={evenement.id} />
            <Input name="motif" placeholder="Motif du rejet" className="w-56" />
            <Button type="submit" variant="destructive" size="lg">Rejeter</Button>
          </form>
        )}
      </div>

      <FormulaireEvenement evenement={evenement} {...options} />
    </>
  );
}
