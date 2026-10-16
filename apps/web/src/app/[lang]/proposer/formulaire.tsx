"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Send } from "lucide-react";
import { compresserImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { proposerEvenement, type EtatProposition } from "./actions";

export interface Libelles {
  champAffiche: string;
  choisirAffiche: string;
  formatsAffiche: string;
  changerAffiche: string;
  champMessage: string;
  aideMessage: string;
  champNom: string;
  champContact: string;
  aideContact: string;
  consentement: string;
  envoyer: string;
  envoiEnCours: string;
  merciTitre: string;
  merciTexte: string;
  proposerAutre: string;
  erreurChamps: string;
  erreurImage: string;
  erreurTrop: string;
  erreurServeur: string;
}

const MESSAGES = { champs: "erreurChamps", image: "erreurImage", trop: "erreurTrop", serveur: "erreurServeur" } as const;

/** Le changement de « cle » remonte un formulaire vierge après un envoi réussi. */
export function FormulaireProposition({ t }: { t: Libelles }) {
  const [cle, setCle] = useState(0);
  return <Formulaire key={cle} t={t} recommencer={() => setCle((c) => c + 1)} />;
}

function Formulaire({ t, recommencer }: { t: Libelles; recommencer: () => void }) {
  const [etat, action, enCours] = useActionState(proposerEvenement, {} as EtatProposition);
  const [apercu, setApercu] = useState<string | null>(null);
  const [preparation, setPreparation] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);

  function choisir(fichier: File | undefined) {
    if (!fichier) return;
    if (apercu) URL.revokeObjectURL(apercu);
    setApercu(URL.createObjectURL(fichier));
  }

  /** Compresse l'affiche dans le navigateur (WebP ~300 Ko) avant l'envoi : rapide même en 3G. */
  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const fichier = donnees.get("affiche");
    if (fichier instanceof File && fichier.size > 0) {
      setPreparation(true);
      try {
        const blob = await compresserImage(fichier);
        donnees.set("affiche", new File([blob], "affiche.webp", { type: "image/webp" }));
      } catch {
        // Format non lisible par le navigateur : on envoie l'original, le serveur tranchera.
      } finally {
        setPreparation(false);
      }
    }
    startTransition(() => action(donnees));
  }

  if (etat.ok) {
    return (
      <div className="motif-zellige rounded-3xl bg-card p-8 text-center shadow-sm ring-1 ring-border [--motif-opacite:0.05] sm:p-12" role="status">
        <CheckCircle2 className="mx-auto size-16 text-success" strokeWidth={1.5} />
        <h2 className="mt-4 text-3xl font-extrabold">{t.merciTitre}</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t.merciTexte}</p>
        <button
          type="button"
          onClick={recommencer}
          className="mt-7 inline-flex h-12 items-center rounded-full border-2 border-encre px-6 font-bold transition hover:bg-encre hover:text-sable"
        >
          {t.proposerAutre}
        </button>
      </div>
    );
  }

  const occupe = enCours || preparation;
  const champ = (erreur?: boolean) =>
    cn(
      "w-full rounded-lg border bg-background px-3 text-base outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
      erreur ? "border-destructive" : "border-input",
    );
  const e = etat.champs ?? {};

  return (
    <form
      action={action}
      onSubmit={envoyer}
      noValidate
      className="grid gap-6 rounded-3xl border-2 border-encre bg-card p-5 shadow-[6px_6px_0_var(--encre)] rtl:shadow-[-6px_6px_0_var(--encre)] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:p-7"
    >
      {/* Affiche */}
      <div>
        <span className="mb-2 block text-sm font-bold">{t.champAffiche} *</span>
        <label
          className={cn(
            "group relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed bg-background p-4 text-center transition",
            e.affiche ? "border-destructive" : "border-encre/25 hover:border-primary",
          )}
          onDragOver={(ev) => ev.preventDefault()}
          onDrop={(ev) => {
            ev.preventDefault();
            const f = ev.dataTransfer.files[0];
            if (f && champFichier.current) {
              const dt = new DataTransfer();
              dt.items.add(f);
              champFichier.current.files = dt.files;
              choisir(f);
            }
          }}
        >
          {apercu ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercu} alt="" className="absolute inset-0 h-full w-full object-contain p-2" />
              <span className="absolute inset-x-3 bottom-3 rounded-full bg-encre/80 py-1.5 text-sm font-semibold text-sable opacity-0 transition group-hover:opacity-100">
                {t.changerAffiche}
              </span>
            </>
          ) : (
            <>
              <span className="flex size-16 items-center justify-center rounded-full bg-accent text-primary transition group-hover:scale-110">
                <ImagePlus className="size-7" />
              </span>
              <span className="font-semibold">{t.choisirAffiche}</span>
              <span className="text-xs text-muted-foreground">{t.formatsAffiche}</span>
            </>
          )}
          <input
            ref={champFichier}
            type="file"
            name="affiche"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(ev) => choisir(ev.target.files?.[0])}
          />
        </label>
      </div>

      {/* Coordonnées */}
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-bold">{t.champMessage}</label>
          <textarea id="message" name="message" rows={4} maxLength={1500} placeholder={t.aideMessage} className={cn(champ(), "py-2")} />
        </div>
        <div>
          <label htmlFor="nom" className="mb-1.5 block text-sm font-bold">{t.champNom} *</label>
          <input id="nom" name="nom" autoComplete="name" maxLength={80} className={cn(champ(e.nom), "h-11")} aria-invalid={!!e.nom} />
        </div>
        <div>
          <label htmlFor="contact" className="mb-1.5 block text-sm font-bold">{t.champContact} *</label>
          <input id="contact" name="contact" dir="ltr" autoComplete="tel" maxLength={120} className={cn(champ(e.contact), "h-11")} aria-invalid={!!e.contact} aria-describedby="aide-contact" />
          <p id="aide-contact" className="mt-1 text-xs text-muted-foreground">{t.aideContact}</p>
        </div>

        {/* Pot de miel anti-robots : invisible pour les humains */}
        <div aria-hidden="true" className="sr-only">
          <label>Site web <input type="text" name="site_web" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <label className={cn("flex items-start gap-3 rounded-xl p-3 text-sm", e.consentement ? "bg-destructive/10" : "bg-muted")}>
          <input type="checkbox" name="consentement" className="mt-0.5 size-5 shrink-0 accent-[var(--terracotta)]" />
          <span>{t.consentement}</span>
        </label>

        {etat.erreur && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {t[MESSAGES[etat.erreur]]}
          </p>
        )}

        <button
          type="submit"
          disabled={occupe}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 text-lg font-bold text-primary-foreground transition hover:bg-encre disabled:opacity-60 sm:self-start"
        >
          {occupe ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 rtl:-scale-x-100" />}
          {occupe ? t.envoiEnCours : t.envoyer}
        </button>
      </div>
    </form>
  );
}
