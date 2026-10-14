"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carrousel léger : défilement natif (doigt, molette, clavier) avec aimantation CSS,
 * plus des flèches et des points. Sans JavaScript, il reste utilisable au doigt.
 */
export function Defilement({
  nombre,
  libelles,
  children,
}: {
  nombre: number;
  libelles: { precedent: string; suivant: string };
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const surDefilement = () => setActif(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    el.addEventListener("scroll", surDefilement, { passive: true });
    return () => el.removeEventListener("scroll", surDefilement);
  }, []);

  const aller = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const cible = (i + nombre) % nombre;
    const sens = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: sens * cible * el.clientWidth, behavior: "smooth" });
  };

  const bouton =
    "flex size-11 items-center justify-center rounded-full border-2 border-white/60 transition hover:bg-white hover:text-terracotta disabled:opacity-40";

  return (
    <div>
      <div ref={ref} className="defilement">{children}</div>
      {nombre > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button type="button" className={bouton} onClick={() => aller(actif - 1)} aria-label={libelles.precedent}>
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: nombre }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => aller(i)}
                aria-label={`${i + 1} / ${nombre}`}
                aria-current={i === actif}
                className={`h-2.5 rounded-full transition-all ${i === actif ? "w-8 bg-safran" : "w-2.5 bg-white/50 hover:bg-white"}`}
              />
            ))}
          </div>
          <button type="button" className={bouton} onClick={() => aller(actif + 1)} aria-label={libelles.suivant}>
            <ChevronRight className="size-5 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
