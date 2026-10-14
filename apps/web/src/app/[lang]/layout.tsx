import type { Metadata } from "next";
import { lang } from "next/root-params";
import "../globals.css";
import { classesPolices } from "@/lib/polices";
import { direction, estLangue, LANGUES, t, type Langue } from "@/lib/i18n";
import { Entete, PiedDePage } from "@/components/public/entete";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wa9tech.tn";

export async function generateStaticParams() {
  return LANGUES.map((l) => ({ lang: l }));
}

export async function generateMetadata(): Promise<Metadata> {
  const l = (await lang()) as Langue;
  const d = t(estLangue(l) ? l : "fr");
  return {
    metadataBase: new URL(SITE),
    title: { default: `WA9TECH — ${d.slogan}`, template: `%s — WA9TECH` },
    description: d.sousSlogan,
    openGraph: { siteName: "WA9TECH", locale: l === "ar" ? "ar_TN" : "fr_TN", type: "website" },
    alternates: { languages: { fr: "/fr", ar: "/ar" } },
  };
}

export default async function PublicLayout({ children }: LayoutProps<"/[lang]">) {
  const brut = await lang();
  const l: Langue = estLangue(brut) ? brut : "fr";
  return (
    <html lang={l} dir={direction(l)} className={`${classesPolices} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Entete l={l} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <PiedDePage l={l} />
      </body>
    </html>
  );
}
