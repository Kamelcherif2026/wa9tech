import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Organisateur } from "@/lib/types";

export default function PageOrganisateurs({ searchParams }: PageProps<"/admin/organisateurs">) {
  return (
    <>
      <EntetePage
        titre="Organisateurs"
        description="Compagnies, festivals, producteurs, lieux qui organisent…"
        actions={
          <Link href="/admin/organisateurs/nouveau" className={buttonVariants({ size: "lg" })}>
            Nouvel organisateur
          </Link>
        }
      />
      <Suspense fallback={<Chargement />}>
        <Liste searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Liste({ searchParams }: { searchParams: PageProps<"/admin/organisateurs">["searchParams"] }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const supabase = await createClient();
  let requete = supabase
    .from("organisateur")
    .select("id, nom, telephone, email, lien")
    .order("nom")
    .limit(1000);
  if (q) requete = requete.ilike("nom", `%${q}%`);
  const { data, error } = await requete.returns<Organisateur[]>();

  if (error) return <p className="text-sm text-destructive">Erreur : {error.message}</p>;

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <Input name="q" placeholder="Rechercher…" defaultValue={q} className="max-w-xs" />
        <Button type="submit" variant="outline" size="lg">Rechercher</Button>
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Téléphone</th>
              <th className="px-4 py-2 font-medium">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {data?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Aucun organisateur.</td>
              </tr>
            )}
            {data?.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-4 py-2">
                  <Link href={`/admin/organisateurs/${o.id}`} className="font-medium hover:text-primary">{o.nom}</Link>
                </td>
                <td className="px-4 py-2">{o.telephone}</td>
                <td className="px-4 py-2">{o.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
