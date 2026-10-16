"use client";

import { useActionState } from "react";
import { enregistrerArtiste } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function FormulaireArtiste({ artiste }: { artiste: { id: string; nom: string; nom_ar: string | null; lien: string | null } }) {
  const [etat, action, enCours] = useActionState(enregistrerArtiste, {});
  const c = etat.champs;
  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form action={action} className="grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="id" value={artiste.id} />
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" name="nom" required defaultValue={c?.nom ?? artiste.nom} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nom_ar">Nom en arabe</Label>
            <Input id="nom_ar" name="nom_ar" dir="rtl" defaultValue={c?.nom_ar ?? artiste.nom_ar ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lien">Lien (page officielle, Facebook, Instagram…)</Label>
            <Input id="lien" name="lien" type="url" placeholder="https://" defaultValue={c?.lien ?? artiste.lien ?? ""} />
          </div>
          {etat.erreur && <p role="alert" className="text-sm text-destructive sm:col-span-2">{etat.erreur}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={enCours}>{enCours ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
