import type { Metadata } from "next";
import "../globals.css";
import { classesPolices } from "@/lib/polices";

// Back-office : pages personnalisées, pas de pré-rendu statique.
export const instant = false;

export const metadata: Metadata = {
  title: "Back-office — WA9TECH",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="fr" className={`${classesPolices} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
