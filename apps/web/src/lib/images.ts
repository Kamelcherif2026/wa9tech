"use client";

import { createClient } from "@/lib/supabase/client";

const TAILLE_MAX = 1600; // px, plus grand côté
const QUALITE = 0.82;

/** Redimensionne et convertit en WebP dans le navigateur (affiches < ~300 Ko). */
export async function compresserImage(fichier: File): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  const ratio = Math.min(1, TAILLE_MAX / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))), "image/webp", QUALITE),
  );
}

/** Envoie une affiche dans le bucket « affiches » et renvoie son URL publique. */
export async function envoyerAffiche(fichier: File): Promise<string> {
  const blob = await compresserImage(fichier);
  const chemin = `evenements/${crypto.randomUUID()}.webp`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("affiches")
    .upload(chemin, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return supabase.storage.from("affiches").getPublicUrl(chemin).data.publicUrl;
}
