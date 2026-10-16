import { cn } from "@/lib/utils";
import type { Teinte } from "@/lib/public/teintes";
import { Etoile, Porte } from "./motifs";

/**
 * En-tête coloré pleine largeur des pages de liste (agenda, ville, catégorie, lieu).
 * « illustration » s'affiche du côté de fin (droite en français, gauche en arabe).
 */
export function BandeauPage({
  surtitre,
  titre,
  titreSecondaire,
  teinte = "bg-bleu text-white",
  illustration,
  children,
}: {
  surtitre?: string;
  titre: string;
  /** Le titre dans l'autre langue (ex. « تونس » sur la page Tunis en français). */
  titreSecondaire?: { texte: string; lang: "fr" | "ar" };
  teinte?: Teinte;
  illustration?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("pleine-largeur motif-zellige relative overflow-hidden [--motif-opacite:0.12]", teinte)}>
      <Porte className="pointer-events-none absolute -end-10 -bottom-24 h-80 w-56 opacity-15 sm:end-[8%]" />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 pt-10 pb-12 sm:pt-12 sm:pb-14">
        <div className="min-w-0">
          {surtitre && (
            <p className="flex items-center gap-2 font-[family-name:var(--font-titre)] text-xs font-extrabold tracking-[0.2em] uppercase opacity-85">
              <Etoile className="size-3.5" /> {surtitre}
            </p>
          )}
          <h1 dir="auto" className="mt-2 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            {titre}
          </h1>
          {titreSecondaire && (
            <p className="mt-1">
              <span
                lang={titreSecondaire.lang}
                dir={titreSecondaire.lang === "ar" ? "rtl" : "ltr"}
                className={cn("inline-block text-2xl font-bold opacity-75", titreSecondaire.lang === "ar" && "font-[family-name:var(--font-arabe)]")}
              >
                {titreSecondaire.texte}
              </span>
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
        {illustration && <div className="hidden shrink-0 sm:block" aria-hidden="true">{illustration}</div>}
      </div>
    </section>
  );
}
