import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntetePage } from "@/components/admin/entete-page";
import { Chargement } from "@/components/admin/chargement";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formaterDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STATUTS = {
  recue: { libelle: "Reçue — lecture IA en cours", variante: "alerte" },
  extraite: { libelle: "Fiche créée", variante: "succes" },
  traitee: { libelle: "Traitée", variante: "neutre" },
  rejetee: { libelle: "Pas un événement", variante: "neutre" },
  erreur: { libelle: "Erreur", variante: "danger" },
} as const;

const CANAUX: Record<string, string> = {
  formulaire: "Site",
  application: "Application",
  whatsapp: "WhatsApp",
  email: "E-mail",
  admin: "Back-office",
  ambassadeur: "Ambassadeur",
  organisateur: "Organisateur",
};

/** « public » : propositions venues du site et de l'application. */
const PUBLIC = ["formulaire", "application"];
const FILTRES = [
  { valeur: "public", libelle: "Public (site + application)" },
  { valeur: "formulaire", libelle: "Site" },
  { valeur: "application", libelle: "Application" },
  { valeur: "", libelle: "Toutes" },
];

interface Ligne {
  id: string;
  canal: string;
  contact_nom: string | null;
  expediteur: string | null;
  texte_brut: string | null;
  images: string[];
  statut: keyof typeof STATUTS;
  erreur: string | null;
  confiance_ia: number | null;
  evenement_id: string | null;
  doublon_de: string | null;
  recue_le: string;
  evenement: { titre_fr: string; statut: string } | null;
}

export default function PageSoumissions({ searchParams }: PageProps<"/admin/soumissions">) {
  return (
    <>
      <EntetePage
        titre="Soumissions"
        description="Affiches reçues (site public, back-office, bientôt WhatsApp). Les coordonnées sont effacées après 6 mois."
      />
      <Suspense fallback={<Chargement />}>
        <Liste searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Liste({ searchParams }: { searchParams: PageProps<"/admin/soumissions">["searchParams"] }) {
  const p = await searchParams;
  const canal = typeof p.canal === "string" ? p.canal : "public";

  const supabase = await createClient();
  let requete = supabase
    .from("soumission")
    .select("id, canal, contact_nom, expediteur, texte_brut, images, statut, erreur, confiance_ia, evenement_id, doublon_de, recue_le, evenement:evenement_id(titre_fr, statut)")
    .order("recue_le", { ascending: false })
    .limit(100);
  if (canal === "public") requete = requete.in("canal", PUBLIC);
  else if (canal) requete = requete.eq("canal", canal);
  const { data, error } = await requete.returns<Ligne[]>();
  if (error) return <p className="text-sm text-destructive">Erreur : {error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {FILTRES.map((f) => (
          <Link
            key={f.valeur}
            href={`/admin/soumissions?canal=${f.valeur}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm",
              canal === f.valeur ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.libelle}
          </Link>
        ))}
      </div>

      {data.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">Aucune soumission pour le moment.</Card>}

      <div className="grid gap-3">
        {data.map((s) => {
          const st = STATUTS[s.statut] ?? STATUTS.recue;
          return (
            <Card key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row">
              {s.images[0] && (
                <a href={s.images[0]} target="_blank" rel="noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.images[0]} alt="" className="h-36 w-28 rounded-md border object-cover" />
                </a>
              )}
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variante={st.variante}>{st.libelle}</Badge>
                  <Badge>{CANAUX[s.canal] ?? s.canal}</Badge>
                  {s.confiance_ia != null && <span className="text-xs text-muted-foreground">confiance IA {Math.round(s.confiance_ia * 100)} %</span>}
                  <span className="ms-auto text-xs text-muted-foreground">{formaterDate(s.recue_le)}</span>
                </div>
                {(s.contact_nom || s.expediteur) && (
                  <p>
                    <span className="font-medium">{s.contact_nom ?? "—"}</span>
                    {s.expediteur && (
                      <>
                        {" · "}
                        <a
                          href={s.expediteur.includes("@") ? `mailto:${s.expediteur}` : `tel:${s.expediteur.replace(/[^\d+]/g, "")}`}
                          className="text-primary hover:underline"
                          dir="ltr"
                        >
                          {s.expediteur}
                        </a>
                      </>
                    )}
                  </p>
                )}
                {s.texte_brut && <p dir="auto" className="line-clamp-3 whitespace-pre-line text-muted-foreground">{s.texte_brut}</p>}
                {s.erreur && s.statut !== "extraite" && <p className="text-destructive">{s.erreur}</p>}
                <div className="flex flex-wrap gap-3">
                  {s.evenement_id && (
                    <Link href={`/admin/evenements/${s.evenement_id}`} className="font-medium text-primary hover:underline">
                      Ouvrir la fiche{s.evenement ? ` « ${s.evenement.titre_fr} »` : ""} →
                    </Link>
                  )}
                  {s.doublon_de && (
                    <Link href={`/admin/evenements/${s.doublon_de}`} className="font-medium text-[oklch(0.45_0.12_75)] hover:underline">
                      Doublon possible →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
