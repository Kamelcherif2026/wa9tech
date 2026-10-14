"use client";

import { useActionState } from "react";
import Link from "next/link";
import { enregistrerOrganisateur } from "./actions";
import type { Organisateur } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function FormulaireOrganisateur({ organisateur }: { organisateur?: Organisateur }) {
  const [etat, action, enCours] = useActionState(enregistrerOrganisateur, {});
  const c = etat.champs;
  const o = organisateur;

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form action={action} className="grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="id" value={o?.id ?? ""} />

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" name="nom" required defaultValue={c?.nom ?? o?.nom} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input id="telephone" name="telephone" type="tel" defaultValue={c?.telephone ?? o?.telephone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={c?.email ?? o?.email ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lien">Site / page Facebook / Instagram</Label>
            <Input id="lien" name="lien" type="url" placeholder="https://" defaultValue={c?.lien ?? o?.lien ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={c?.description ?? o?.description ?? ""} />
          </div>

          {etat.erreur && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">{etat.erreur}</p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="lg" disabled={enCours}>
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Link href="/admin/organisateurs" className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground hover:text-foreground">
              Annuler
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
