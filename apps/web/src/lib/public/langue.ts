import { lang } from "next/root-params";
import { estLangue, type Langue } from "@/lib/i18n";

/** Langue courante (fr par défaut si le segment est inconnu). */
export async function langue(): Promise<Langue> {
  const l = await lang();
  return estLangue(l) ? l : "fr";
}
