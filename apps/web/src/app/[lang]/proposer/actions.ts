"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { clientAdmin } from "@/lib/supabase/admin";
import { traiterSoumission } from "@/lib/ia/traitement";

export interface EtatProposition {
  ok?: boolean;
  /** Clé de message (traduite côté client). */
  erreur?: "champs" | "image" | "trop" | "serveur";
  champs?: Partial<Record<"nom" | "contact" | "consentement" | "affiche", true>>;
}

const TYPES = ["image/webp", "image/jpeg", "image/png"];
const TAILLE_MAX = 3 * 1024 * 1024; // l'affiche est déjà compressée dans le navigateur
const ENVOIS_PAR_HEURE = 5;

const telephone = /^\+?[\d\s.-]{8,16}$/;
const schema = z.object({
  nom: z.string().trim().min(2).max(80),
  contact: z
    .string()
    .trim()
    .max(120)
    .refine((v) => z.email().safeParse(v).success || telephone.test(v)),
  message: z.string().trim().max(1500).optional(),
  consentement: z.literal("on"),
});

/** Empreinte de l'IP (salée) : permet de limiter les abus sans stocker l'adresse. */
async function empreinteIp() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
  return createHash("sha256").update(`${process.env.SEL_IP ?? "wa9tech"}:${ip}`).digest("hex").slice(0, 32);
}

export async function proposerEvenement(_etat: EtatProposition, formData: FormData): Promise<EtatProposition> {
  // Pot de miel : un humain ne remplit jamais ce champ caché. On fait semblant d'accepter.
  if (String(formData.get("site_web") ?? "") !== "") return { ok: true };

  const lu = schema.safeParse({
    nom: formData.get("nom"),
    contact: formData.get("contact"),
    message: formData.get("message") || undefined,
    consentement: formData.get("consentement"),
  });
  const affiche = formData.get("affiche");
  const afficheValide = affiche instanceof File && affiche.size > 0;

  if (!lu.success || !afficheValide) {
    const champs: EtatProposition["champs"] = {};
    for (const i of lu.error?.issues ?? []) champs[i.path[0] as "nom" | "contact" | "consentement"] = true;
    if (!afficheValide) champs.affiche = true;
    return { erreur: "champs", champs };
  }
  if (!TYPES.includes(affiche.type) || affiche.size > TAILLE_MAX) return { erreur: "image", champs: { affiche: true } };

  try {
    const sb = clientAdmin();
    const ipHash = await empreinteIp();

    // Limite d'envois par heure et par connexion
    const { count } = await sb
      .from("soumission")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("recue_le", new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= ENVOIS_PAR_HEURE) return { erreur: "trop" };

    // Affiche dans le stockage public (dossier séparé de celles du back-office)
    const extension = affiche.type === "image/png" ? "png" : affiche.type === "image/jpeg" ? "jpg" : "webp";
    const chemin = `soumissions/${randomUUID()}.${extension}`;
    const { error: erreurEnvoi } = await sb.storage
      .from("affiches")
      .upload(chemin, affiche, { contentType: affiche.type, cacheControl: "31536000" });
    if (erreurEnvoi) throw new Error(erreurEnvoi.message);
    const url = sb.storage.from("affiches").getPublicUrl(chemin).data.publicUrl;

    const { nom, contact, message } = lu.data;
    const { data: soumission, error } = await sb
      .from("soumission")
      .insert({
        canal: "formulaire",
        contact_nom: nom,
        expediteur: contact,
        texte_brut: message ?? null,
        images: [url],
        ip_hash: ipHash,
        statut: "recue",
      })
      .select("id")
      .single();
    if (error || !soumission) throw new Error(error?.message ?? "Insertion impossible");

    // Lecture par l'IA après la réponse : la personne n'attend pas les 5 à 15 secondes.
    after(async () => {
      const r = await traiterSoumission(clientAdmin(), { soumissionId: soumission.id, url, texte: message, source: "formulaire" });
      if (!r.ok) console.warn("[proposer] soumission", soumission.id, ":", r.erreur);
    });

    return { ok: true };
  } catch (e) {
    console.error("[proposer]", e instanceof Error ? e.message : e);
    return { erreur: "serveur" };
  }
}
