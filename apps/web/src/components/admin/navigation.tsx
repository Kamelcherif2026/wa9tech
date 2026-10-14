"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Gauge, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const liens = [
  { href: "/admin", libelle: "Tableau de bord", icone: Gauge, exact: true },
  { href: "/admin/evenements", libelle: "Événements", icone: CalendarDays, bientot: true },
  { href: "/admin/lieux", libelle: "Lieux", icone: MapPin },
  { href: "/admin/organisateurs", libelle: "Organisateurs", icone: Users },
];

export function Navigation() {
  const chemin = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-4">
      {liens.map(({ href, libelle, icone: Icone, exact, bientot }) => {
        const actif = exact ? chemin === href : chemin.startsWith(href);
        if (bientot) {
          return (
            <span
              key={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted-foreground/60"
              title="Sprint 1 — partie B"
            >
              <Icone className="size-4" /> {libelle}
            </span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
              actif ? "bg-accent font-medium text-accent-foreground" : "hover:bg-muted",
            )}
          >
            <Icone className="size-4" /> {libelle}
          </Link>
        );
      })}
    </nav>
  );
}
