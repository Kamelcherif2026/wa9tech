import { fiche } from "@/lib/public/requetes";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wa9tech.tn";

/** Échappement des textes ICS (RFC 5545). */
const ics = (t: string) => t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
const horodatage = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(_req: Request, { params }: RouteContext<"/api/ics/[slug]">) {
  const { slug } = await params;
  const e = await fiche(slug);
  if (!e) return new Response("Introuvable", { status: 404 });

  const lieu = [e.lieu?.nom ?? e.lieu_texte, e.lieu?.adresse, e.ville?.nom_fr].filter(Boolean).join(", ");
  const url = `${SITE}/fr/evenement/${e.slug}`;
  const maintenant = horodatage(new Date().toISOString());

  const evenements = e.representations
    .filter((r) => !r.annulee)
    .map((r, i) => {
      const fin = r.fin ?? new Date(new Date(r.debut).getTime() + 2 * 3600_000).toISOString();
      return [
        "BEGIN:VEVENT",
        `UID:${e.id}-${i}@wa9tech.tn`,
        `DTSTAMP:${maintenant}`,
        `DTSTART:${horodatage(r.debut)}`,
        `DTEND:${horodatage(fin)}`,
        `SUMMARY:${ics(e.titre_fr)}`,
        lieu ? `LOCATION:${ics(lieu)}` : null,
        `DESCRIPTION:${ics(`${e.infos_reservation ?? ""}\n${url}`.trim())}`,
        `URL:${url}`,
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    });

  const corps = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WA9TECH//Agenda culturel//FR", "CALSCALE:GREGORIAN", ...evenements, "END:VCALENDAR"].join("\r\n");

  return new Response(corps, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
