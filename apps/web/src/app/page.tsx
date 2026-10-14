import Link from "next/link";

export default function Accueil() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        WA9TECH <span className="text-primary">وقتاش</span>
      </h1>
      <p className="text-muted-foreground">L&apos;agenda culturel de la Tunisie — bientôt en ligne.</p>
      <Link href="/admin" className="text-sm text-primary underline-offset-4 hover:underline">
        Back-office
      </Link>
    </main>
  );
}
