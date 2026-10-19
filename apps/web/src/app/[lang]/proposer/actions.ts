"use server";

import { enregistrerProposition, type ResultatProposition } from "@/lib/proposition";

/** État du formulaire « Proposer un événement » du site. */
export type EtatProposition = ResultatProposition;

export async function proposerEvenement(_etat: EtatProposition, formData: FormData): Promise<EtatProposition> {
  return enregistrerProposition(formData, "formulaire");
}
