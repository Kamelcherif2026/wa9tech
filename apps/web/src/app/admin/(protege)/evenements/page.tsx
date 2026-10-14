import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { formaterDate } from "@/lib/dates";
import { STATUTS_EVENEMENT, type StatutEvenement } from "@/lib/types";
import { cn } from "@/lib/utils";

const ONGLETS: { valeur: string; libelle: string }[] = [
  { valeur: "", libelle: "Tous" },
  { valeur: "en_attente", libelle: "En attente" },
  { valeur: "brouillon", libelle: "Brouillons" },
  { valeur: "publie", libelle: "Publiés" },
  { valeur: "rejete", libelle: "Rejetés" },
  { valeur: "expire", libelle: "Expirés" },
  { valeur: "archive", libelle: "Archivés" },
];

export default function PageEvenements({ searchParams }: PageProps<"/admin/evenements">) {
  return (
    <>
      <EntetePage
        titre="Événements"
        actions={
          <Link href="/admin/evenements/nouveau" className={buttonVariants({ size: "lg" })}>
            Nouvel événement
          </Link>
        }
      />
      <Suspense fallback={<Chargement />}>
        <Liste searchParams={searchParams} />
      </Suspense>
    </>
  );
}

interface Ligne {
  id: string;
  titre_fr: string;
  statut: StatutEvenement;
  prochaine_date: string | null;
  lieu_texte: string | null;
  categorie: { libelle_fr: string } | null;
  lieu: { nom: string } | null;
  ville: { nom_fr: string } | null;
}

async function Liste({ searchParams }: { searchParams: PageProps<"/admin/evenements">["searchParams"] }) {
  const p = await searchParams;
  const statut = typeof p.statut === "string" ? p.statut : "";
  const q = typeof p.q === "string" ? p.q.trim() : "";

  const supabase = await createClient();
  let requete = supabase
    .from("evenement")
    .select("id, titre_fr, statut, prochaine_date, lieu_texte, categorie:categorie_id(libelle_fr), lieu:lieu_id(nom), ville:ville_id(nom_fr)")
    .order("prochaine_date", { ascending: true, nullsFirst: false })
    .limit(200);
  if (statut) requete = requete.eq("statut", statut);
  else requete = requete.neq("statut", "archive");
  if (q) requete = requete.ilike("titre_fr", `%${q}%`);
  const { data, error } = await requete.returns<Ligne[]>();

  if (error) return <p className="text-sm text-destructive">Erreur : {error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {ONGLETS.map((o) => (
          <Link
            key={o.valeur}
            href={o.valeur ? `/admin/evenements?statut=${o.valeur}` : "/admin/evenements"}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm",
              statut === o.valeur ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {o.libelle}
          </Link>
        ))}
      </div>
      <form className="flex gap-2">
        {statut && <input type="hidden" name="statut" value={statut} />}
        <Input name="q" placeholder="Rechercher un titre…" defaultValue={q} className="max-w-xs" />
        <Button type="submit" variant="outline" size="lg">Rechercher</Button>
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Titre</th>
              <th className="px-4 py-2 font-medium">Catégorie</th>
              <th className="px-4 py-2 font-medium">Lieu</th>
              <th className="px-4 py-2 font-medium">Prochaine date</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun événement.</td></tr>
            )}
            {data?.map((e) => {
              const s = STATUTS_EVENEMENT[e.statut];
              return (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-2">
                    <Link href={`/admin/evenements/${e.id}`} className="font-medium hover:text-primary">{e.titre_fr}</Link>
                  </td>
                  <td className="px-4 py-2">{e.categorie?.libelle_fr}</td>
                  <td className="px-4 py-2">{e.lieu?.nom ?? e.lieu_texte}{e.ville ? ` · ${e.ville.nom_fr}` : ""}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formaterDate(e.prochaine_date)}</td>
                  <td className="px-4 py-2"><Badge variante={s.variante}>{s.libelle}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
