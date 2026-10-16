import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { TYPES_LIEU, type TypeLieu, type Ville } from "@/lib/types";

export default function PageLieux({ searchParams }: PageProps<"/admin/lieux">) {
  return (
    <>
      <EntetePage
        titre="Lieux"
        description="Théâtres, cinémas, galeries, cafés culturels…"
        actions={
          <Link href="/admin/lieux/nouveau" className={buttonVariants({ size: "lg" })}>
            Nouveau lieu
          </Link>
        }
      />
      <Suspense fallback={<Chargement />}>
        <ListeLieux searchParams={searchParams} />
      </Suspense>
    </>
  );
}

interface LigneLieu {
  id: string;
  nom: string;
  type: TypeLieu;
  actif: boolean;
  lat: number | null;
  ville: { nom_fr: string } | null;
}

async function ListeLieux({ searchParams }: { searchParams: PageProps<"/admin/lieux">["searchParams"] }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const ville = typeof params.ville === "string" ? params.ville : "";

  const supabase = await createClient();
  let requete = supabase
    .from("lieu")
    .select("id, nom, type, actif, lat, ville:ville_id(nom_fr)")
    .order("nom")
    .limit(1000);
  if (q) requete = requete.ilike("nom", `%${q}%`);
  if (ville) requete = requete.eq("ville_id", Number(ville));

  const [{ data: lieux, error }, { data: villes }] = await Promise.all([
    requete.returns<LigneLieu[]>(),
    supabase.from("ville").select("id, nom_fr").order("nom_fr").returns<Pick<Ville, "id" | "nom_fr">[]>(),
  ]);

  if (error) return <p className="text-sm text-destructive">Erreur : {error.message}</p>;

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Rechercher un lieu…" defaultValue={q} className="max-w-xs" />
        <NativeSelect name="ville" defaultValue={ville} className="max-w-48">
          <option value="">Toutes les villes</option>
          {villes?.map((v) => (
            <option key={v.id} value={v.id}>{v.nom_fr}</option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" size="lg">Filtrer</Button>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Ville</th>
              <th className="px-4 py-2 font-medium">GPS</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {lieux?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun lieu. Commencez par en créer un.
                </td>
              </tr>
            )}
            {lieux?.map((l) => (
              <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-4 py-2">
                  <Link href={`/admin/lieux/${l.id}`} className="font-medium hover:text-primary">
                    {l.nom}
                  </Link>
                </td>
                <td className="px-4 py-2">{TYPES_LIEU[l.type]}</td>
                <td className="px-4 py-2">{l.ville?.nom_fr}</td>
                <td className="px-4 py-2">
                  {l.lat != null ? <Badge variante="succes">✓</Badge> : <Badge variante="alerte">manquant</Badge>}
                </td>
                <td className="px-4 py-2">
                  {l.actif ? <Badge variante="succes">actif</Badge> : <Badge>inactif</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
