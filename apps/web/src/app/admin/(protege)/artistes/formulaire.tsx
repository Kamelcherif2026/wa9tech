"use client";

import { useActionState } from "react";
import { enregistrerArtiste } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";

export function FormulaireArtiste({
  artiste,
  disciplines,
}: {
  artiste: { id: string; nom: string; nom_ar: string | null; lien: string | null; discipline_id: number | null };
  disciplines: { id: number; libelle_fr: string }[];
}) {
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
          <div className="space-y-2">
            <Label htmlFor="discipline_id">Discipline principale</Label>
            <NativeSelect id="discipline_id" name="discipline_id" defaultValue={c?.discipline_id ?? (artiste.discipline_id ? String(artiste.discipline_id) : "")}>
              <option value="">— Non précisée —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.libelle_fr}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
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
