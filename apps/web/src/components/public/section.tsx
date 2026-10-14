import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Etoile } from "./motifs";

export function Section({
  titre,
  sousTitre,
  lien,
  libelleLien,
  children,
}: {
  titre: string;
  sousTitre?: string;
  lien?: string;
  libelleLien?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            <Etoile className="size-5 shrink-0 text-safran" />
            {titre}
          </h2>
          {sousTitre && <p className="mt-1 ps-7.5 text-sm text-muted-foreground">{sousTitre}</p>}
        </div>
        {lien && (
          <Link
            href={lien}
            className="group inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-encre px-3.5 py-1.5 text-sm font-semibold transition hover:bg-encre hover:text-sable"
          >
            {libelleLien}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
