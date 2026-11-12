import type { Metadata } from "next";
import { Bell, Download, Heart, Map, Smartphone } from "lucide-react";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { BandeauPage } from "@/components/public/bandeau-page";

/** Dernière APK publiée automatiquement par GitHub (en attendant le Play Store). */
const APK = "https://github.com/Kamelcherif2026/wa9tech/releases/latest/download/wa9tech.apk";
const APK_32 = "https://github.com/Kamelcherif2026/wa9tech/releases/latest/download/wa9tech-anciens-telephones.apk";

export async function generateMetadata(): Promise<Metadata> {
  const l = await langue();
  const d = t(l);
  return {
    title: d.applicationTitre,
    description: d.applicationIntro,
    alternates: { canonical: `/${l}/application`, languages: { fr: "/fr/application", ar: "/ar/application" } },
  };
}

export default async function PageApplication() {
  const l = await langue();
  const d = t(l);
  const atouts = [
    { icone: Heart, texte: l === "ar" ? "خرجاتك المفضّلة" : "Vos sorties en favoris" },
    { icone: Bell, texte: l === "ar" ? "تذكير قبل العرض" : "Rappels avant le spectacle" },
    { icone: Map, texte: l === "ar" ? "خريطة الفعاليات" : "Carte des événements" },
  ];

  return (
    <>
      <BandeauPage
        surtitre={d.applicationSurtitre}
        titre={d.applicationTitre}
        teinte="bg-bleu text-white"
        illustration={
          <span className="flex size-36 rotate-6 items-center justify-center rounded-[2rem] bg-sable shadow-xl lg:size-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marque/icone-512.png" alt="" width={120} height={120} className="size-28 lg:size-32" />
          </span>
        }
      >
        <p className="max-w-xl text-base opacity-90 sm:text-lg">{d.applicationIntro}</p>
      </BandeauPage>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Téléchargement */}
        <section className="rounded-3xl border-2 border-encre bg-card p-6 shadow-[6px_6px_0_var(--encre)] rtl:shadow-[-6px_6px_0_var(--encre)] sm:p-8">
          <a
            href={APK}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-primary px-7 text-lg font-bold text-primary-foreground transition hover:bg-encre sm:w-auto"
          >
            <Download className="size-6" /> {d.telecharger}
          </a>
          <p className="mt-3 text-sm">
            <a href={APK_32} className="text-muted-foreground underline underline-offset-4 hover:text-primary">{d.telechargerAncien}</a>
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">{d.installationTitre}</h2>
          <ol className="mt-4 space-y-4">
            {d.installationEtapes.map((etape, i) => (
              <li key={etape} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-encre font-[family-name:var(--font-titre)] text-lg font-extrabold text-safran">
                  {i + 1}
                </span>
                <span className="pt-2 font-medium leading-snug">{etape}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-xl bg-accent p-4 text-sm text-accent-foreground">{d.miseAJourAuto} {d.bientotPlayStore}</p>
        </section>

        {/* QR code + atouts */}
        <aside className="space-y-6">
          <div className="hidden rounded-3xl bg-card p-6 text-center ring-1 ring-border sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marque/qr-application.svg" alt="QR code" width={220} height={220} className="mx-auto size-56" />
            <p className="mt-3 text-sm font-semibold">{d.scannerQr}</p>
          </div>
          <ul className="space-y-3">
            {atouts.map(({ icone: Icone, texte }) => (
              <li key={texte} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                <Icone className="size-6 shrink-0 text-primary" /> <span className="font-semibold">{texte}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              <Smartphone className="size-5 shrink-0" /> {d.iphone}
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}
