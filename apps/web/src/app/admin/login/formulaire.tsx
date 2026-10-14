"use client";

import { useActionState } from "react";
import { seConnecter } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState(seConnecter, {});

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="suite" value={suite} />
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={etat.champs?.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mot_de_passe">Mot de passe</Label>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {etat.erreur && (
            <p role="alert" className="text-sm text-destructive">
              {etat.erreur}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={enCours}>
            {enCours ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
