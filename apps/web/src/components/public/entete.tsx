import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { autreLangue, t, type Langue } from "@/lib/i18n";
import { ChangerLangue } from "./changer-langue";
import { Etoile } from "./motifs";

const classeLangue = "rounded-full border-2 border-encre px-2.5 py-1 font-semibold sm:px-3.5 transition hover:bg-encre hover:text-sable";

export function Entete({ l }: { l: Langue }) {
  const d = t(l);
  const autre = autreLangue(l);
  const lien = "rounded-full px-2 py-2 font-medium sm:px-3 transition hover:bg-encre/5 hover:text-primary";
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
      <div className="bande-tricolore" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
        <Link href={`/${l}`} className="flex shrink-0 items-center" aria-label="WA9TECH — accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marque/logo-wa9tech.svg" alt="WA9TECH" width={150} height={36} className="h-8 w-auto sm:h-11" />
        </Link>
        <nav className="flex items-center gap-0.5 text-sm">
          <Link href={`/${l}/evenements`} className={lien}>{d.agenda}</Link>
          <Link href={`/${l}#disciplines`} className={`${lien} hidden sm:block`}>{d.navCategories}</Link>
          <Link href={`/${l}#villes`} className={`${lien} hidden sm:block`}>{d.navVilles}</Link>
          <Link
            href={`/${l}/proposer`}
            className="ms-1 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 sm:gap-1.5 sm:px-3.5 font-bold text-primary-foreground transition hover:bg-encre"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">{d.proposer}</span>
            <span className="sm:hidden">{d.proposerCourt}</span>
          </Link>
          <span className="ms-1 sm:ms-1.5">
            <Suspense
              fallback={
                <Link href={`/${autre}`} className={classeLangue}>
                  {autre === "ar" ? "العربية" : "Français"}
                </Link>
              }
            >
              <ChangerLangue vers={autre} className={classeLangue} />
            </Suspense>
          </span>
        </nav>
      </div>
      <div className="h-px bg-border" />
    </header>
  );
}

export function PiedDePage({ l }: { l: Langue }) {
  const d = t(l);
  const lien = "hover:text-safran transition";
  return (
    <footer className="mt-24">
      <div className="bande-tricolore" />
      <div className="motif-zellige bg-bleu text-white [--motif-opacite:0.12]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marque/logo-wa9tech-negatif.svg" alt="WA9TECH" width={170} height={40} className="h-11 w-auto" />
            <p className="mt-1"><span className="inline-block font-[family-name:var(--font-arabe)] text-2xl font-bold text-safran" lang="ar" dir="rtl">وقتاش ؟</span></p>
            <p className="mt-4 max-w-sm text-lg font-semibold">{d.slogan}</p>
            <Link href={`/${l}/proposer`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-safran px-4 py-2 text-sm font-bold text-encre transition hover:bg-white">
              <Plus className="size-4" strokeWidth={2.5} /> {d.soumettre}
            </Link>
          </div>
          <nav className="grid content-start gap-2 text-sm">
            <p className="mb-1 flex items-center gap-2 font-bold text-safran"><Etoile className="size-3.5" /> WA9TECH</p>
            <Link href={`/${l}/evenements`} className={lien}>{d.agenda}</Link>
            <Link href={`/${l}/evenements?quand=aujourdhui`} className={lien}>{d.quandOptions.aujourdhui}</Link>
            <Link href={`/${l}/evenements?quand=weekend`} className={lien}>{d.quandOptions.weekend}</Link>
            <Link href={`/${l}/evenements?gratuit=1`} className={lien}>{d.gratuit}</Link>
          </nav>
          <nav className="grid content-start gap-2 text-sm">
            <p className="mb-1 flex items-center gap-2 font-bold text-safran"><Etoile className="size-3.5" /> {d.navVilles}</p>
            {(["tunis", "sousse", "sfax", "hammamet", "djerba"] as const).map((v) => (
              <Link key={v} href={`/${l}/ville/${v}`} className={`${lien} capitalize`}>{NOMS_VILLES[v][l]}</Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/15">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/70">{d.apropos}</p>
        </div>
      </div>
    </footer>
  );
}

const NOMS_VILLES = {
  tunis: { fr: "Tunis", ar: "تونس" },
  sousse: { fr: "Sousse", ar: "سوسة" },
  sfax: { fr: "Sfax", ar: "صفاقس" },
  hammamet: { fr: "Hammamet", ar: "الحمامات" },
  djerba: { fr: "Djerba", ar: "جربة" },
} as const;
