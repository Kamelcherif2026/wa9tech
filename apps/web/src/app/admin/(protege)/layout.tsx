import { Suspense } from "react";
import { exigerStaff } from "@/lib/auth";
import { seDeconnecter } from "../actions";
import { Navigation } from "@/components/admin/navigation";
import { Chargement } from "@/components/admin/chargement";
import { Button } from "@/components/ui/button";

export default function EspaceAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <aside className="border-b bg-card md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="p-4 text-lg font-bold">
          WA9TECH <span className="text-primary">وقتاش</span>
        </div>
        <Navigation />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<Chargement />}>
          <Garde>{children}</Garde>
        </Suspense>
      </div>
    </div>
  );
}

async function Garde({ children }: { children: React.ReactNode }) {
  const utilisateur = await exigerStaff();

  if (!utilisateur) {
    return (
      <div className="m-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Accès refusé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre compte n&apos;a pas les droits de modération. Contactez l&apos;administrateur.
        </p>
        <form action={seDeconnecter} className="mt-4">
          <Button variant="outline" type="submit">Se déconnecter</Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-end gap-3 border-b bg-card px-6 py-3 text-sm">
        <span className="text-muted-foreground">
          {utilisateur.nom ?? utilisateur.email} · {utilisateur.role}
        </span>
        <form action={seDeconnecter}>
          <Button variant="ghost" size="sm" type="submit">Déconnexion</Button>
        </form>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}
