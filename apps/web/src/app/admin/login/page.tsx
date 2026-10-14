import { Suspense } from "react";
import { FormulaireConnexion } from "./formulaire";

export default function PageConnexion({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marque/logo-wa9tech-bilingue.svg" alt="WA9TECH — وقتاش" width={200} height={90} className="mx-auto h-24 w-auto" />
          <p className="mt-1 text-sm text-muted-foreground">Back-office — connexion</p>
        </div>
        <Suspense>
          <FormulaireAvecSuite searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function FormulaireAvecSuite({
  searchParams,
}: {
  searchParams: PageProps<"/admin/login">["searchParams"];
}) {
  const { suite } = await searchParams;
  return <FormulaireConnexion suite={typeof suite === "string" ? suite : "/admin"} />;
}
