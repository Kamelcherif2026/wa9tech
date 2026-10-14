"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Bascule FR ⇄ AR en restant sur la même page. */
export function ChangerLangue({ vers, className }: { vers: "fr" | "ar"; className?: string }) {
  const chemin = usePathname() ?? "/";
  const cible = chemin.replace(/^\/(fr|ar)(?=\/|$)/, `/${vers}`);
  return (
    <Link
      href={cible}
      hrefLang={vers}
      lang={vers}
      className={className ?? "rounded-lg border px-3 py-1.5 font-medium hover:bg-muted"}
    >
      {vers === "ar" ? "العربية" : "Français"}
    </Link>
  );
}
