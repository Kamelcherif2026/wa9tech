import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Card, CardContent } from "@/components/ui/card";
import { Chargement } from "@/components/admin/chargement";

export default function TableauDeBord() {
  return (
    <>
      <EntetePage titre="Tableau de bord" description="Vue d'ensemble de l'agenda." />
      <Suspense fallback={<Chargement />}>
        <Indicateurs />
      </Suspense>
    </>
  );
}

async function Indicateurs() {
  const supabase = await createClient();
  const compter = (table: string, filtre?: [string, string]) => {
    let requete = supabase.from(table).select("*", { count: "exact", head: true });
    if (filtre) requete = requete.eq(filtre[0], filtre[1]);
    return requete.then(({ count }) => count ?? 0);
  };

  const [enAttente, publies, lieux, organisateurs] = await Promise.all([
    compter("evenement", ["statut", "en_attente"]),
    compter("evenement", ["statut", "publie"]),
    compter("lieu", ["actif", "true"]),
    compter("organisateur"),
  ]);

  const tuiles = [
    { libelle: "En attente de validation", valeur: enAttente, href: "/admin" },
    { libelle: "Événements publiés", valeur: publies, href: "/admin" },
    { libelle: "Lieux actifs", valeur: lieux, href: "/admin/lieux" },
    { libelle: "Organisateurs", valeur: organisateurs, href: "/admin/organisateurs" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tuiles.map((t) => (
        <Link key={t.libelle} href={t.href}>
          <Card className="transition-colors hover:border-primary/40">
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.libelle}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{t.valeur}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
