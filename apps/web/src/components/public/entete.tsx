import { Suspense } from "react";
import Link from "next/link";
import { autreLangue, t, type Langue } from "@/lib/i18n";
import { ChangerLangue } from "./changer-langue";

export function Entete({ l }: { l: Langue }) {
  const d = t(l);
  const autre = autreLangue(l);
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={`/${l}`} className="flex items-center" aria-label="WA9TECH — accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marque/logo-wa9tech.svg" alt="WA9TECH" width={150} height={36} className="h-11 w-auto" />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href={`/${l}/evenements`} className="rounded-lg px-3 py-2 hover:bg-muted">{d.agenda}</Link>
          <Suspense
            fallback={
              <Link href={`/${autre}`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-muted">
                {autre === "ar" ? "العربية" : "Français"}
              </Link>
            }
          >
            <ChangerLangue vers={autre} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

export function PiedDePage({ l }: { l: Langue }) {
  const d = t(l);
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-8 text-sm text-muted-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marque/logo-wa9tech-bilingue.svg" alt="WA9TECH — وقتاش" width={140} height={60} className="mb-2 h-14 w-auto self-start" />
        <p className="font-semibold text-foreground">{d.slogan}</p>
        <p>{d.soumettre}</p>
        <p>{d.apropos}</p>
      </div>
    </footer>
  );
}
