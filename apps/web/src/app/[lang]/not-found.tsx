import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Porte } from "@/components/public/motifs";

/** Page 404 bilingue (le segment de langue n'est pas toujours connu ici). */
export default function Introuvable() {
  return (
    <div className="grid items-center gap-10 py-16 sm:py-24 md:grid-cols-2">
      <div aria-hidden="true" className="relative mx-auto h-72 w-52">
        <span className="absolute -top-4 -end-8 size-20 rounded-full bg-safran" />
        <div className="arche motif-zellige absolute inset-0 overflow-hidden bg-bleu text-white shadow-xl [--motif-opacite:0.16]">
          <Porte className="absolute inset-x-5 top-5 bottom-0 h-[calc(100%-1.25rem)] w-[calc(100%-2.5rem)] text-white/30" />
          <p className="absolute inset-x-0 bottom-10 text-center font-[family-name:var(--font-titre)] text-7xl font-extrabold">404</p>
        </div>
      </div>
      <div className="text-center md:text-start">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Page introuvable</h1>
        <p className="mt-2">
          <span lang="ar" dir="rtl" className="inline-block font-[family-name:var(--font-arabe)] text-3xl font-bold text-primary">الصفحة غير موجودة</span>
        </p>
        <p className="mt-4 text-muted-foreground">Cette page n&apos;existe pas ou plus. — هذه الصفحة غير متوفرة.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
          <Link href="/fr" className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition hover:bg-encre">
            Accueil <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </Link>
          <Link href="/ar" lang="ar" className="inline-flex h-12 items-center rounded-full border-2 border-encre px-6 font-bold transition hover:bg-encre hover:text-sable">
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
