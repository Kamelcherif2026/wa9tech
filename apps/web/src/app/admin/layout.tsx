import type { Metadata } from "next";

// Back-office : pages personnalisées, pas de pré-rendu statique.
export const instant = false;

export const metadata: Metadata = {
  title: "Back-office — WA9TECH",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
