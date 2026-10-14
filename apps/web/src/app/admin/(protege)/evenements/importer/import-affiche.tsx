"use client";

import { useActionState, useState, useTransition } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { importerAffiche } from "./actions";
import { envoyerAffiche } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ImportAffiche() {
  const [etat, action, lectureEnCours] = useActionState(importerAffiche, {});
  const [url, setUrl] = useState<string | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoiEnCours, demarrerEnvoi] = useTransition();

  function choisir(fichier: File | undefined) {
    if (!fichier) return;
    setErreurEnvoi(null);
    setUrl(null);
    setApercu(URL.createObjectURL(fichier));
    demarrerEnvoi(async () => {
      try {
        setUrl(await envoyerAffiche(fichier));
      } catch (e) {
        setErreurEnvoi(e instanceof Error ? e.message : "Envoi impossible");
      }
    });
  }

  const occupe = envoiEnCours || lectureEnCours;

  return (
    <Card className="max-w-3xl">
      <CardContent>
        <form action={action} className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <input type="hidden" name="url" value={url ?? ""} />

          <label
            className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              choisir(e.dataTransfer.files[0]);
            }}
          >
            {apercu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apercu} alt="Affiche" className="h-full w-full object-contain" />
            ) : (
              <>
                <ImagePlus className="size-6" />
                Choisir ou glisser l&apos;affiche
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={occupe}
              onChange={(e) => choisir(e.target.files?.[0])}
            />
          </label>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="texte">Texte accompagnant l&apos;affiche (facultatif)</Label>
              <Textarea
                id="texte"
                name="texte"
                rows={5}
                placeholder="Collez ici la légende de la publication Facebook / Instagram si elle contient des infos utiles (prix, réservation…)."
              />
            </div>

            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{url ? "✓" : envoiEnCours ? "…" : "1."} Affiche envoyée</li>
              <li>{lectureEnCours ? "…" : "2."} Lecture par l&apos;IA (5 à 15 secondes)</li>
              <li>3. Vérification et publication par vous</li>
            </ul>

            {(erreurEnvoi || etat.erreur) && (
              <p role="alert" className="text-sm text-destructive">{erreurEnvoi ?? etat.erreur}</p>
            )}

            <div>
              <Button type="submit" size="lg" disabled={!url || occupe}>
                <Sparkles /> {lectureEnCours ? "Lecture en cours…" : "Lire l'affiche"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
