import Link from "next/link";

export function Section({ titre, lien, libelleLien, children }: { titre: string; lien?: string; libelleLien?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{titre}</h2>
        {lien && <Link href={lien} className="text-sm font-medium text-primary hover:underline">{libelleLien}</Link>}
      </div>
      {children}
    </section>
  );
}
