"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { enregistrerLieu } from "./actions";
import { extraireCoordonnees } from "@/lib/geo";
import { TYPES_LIEU, type Lieu, type Ville } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";

export function FormulaireLieu({ lieu, villes }: { lieu?: Lieu; villes: Ville[] }) {
  const [etat, action, enCours] = useActionState(enregistrerLieu, {});
  const c = etat.champs;
  const gpsInitial = lieu?.lat != null && lieu?.lng != null ? `${lieu.lat}, ${lieu.lng}` : "";
  const [gps, setGps] = useState(c?.gps ?? gpsInitial);
  const coords = gps ? extraireCoordonnees(gps) : null;

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form action={action} className="grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="id" value={lieu?.id ?? ""} />

          <Champ label="Nom *" htmlFor="nom">
            <Input id="nom" name="nom" required defaultValue={c?.nom ?? lieu?.nom} />
          </Champ>
          <Champ label="Nom en arabe" htmlFor="nom_ar">
            <Input id="nom_ar" name="nom_ar" dir="rtl" defaultValue={c?.nom_ar ?? lieu?.nom_ar ?? ""} />
          </Champ>

          <Champ label="Type *" htmlFor="type">
            <NativeSelect id="type" name="type" required defaultValue={c?.type ?? lieu?.type ?? ""}>
              <option value="" disabled>Choisir…</option>
              {Object.entries(TYPES_LIEU).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </NativeSelect>
          </Champ>
          <Champ label="Ville *" htmlFor="ville_id">
            <NativeSelect
              id="ville_id"
              name="ville_id"
              required
              defaultValue={c?.ville_id ?? (lieu?.ville_id ? String(lieu.ville_id) : "")}
            >
              <option value="" disabled>Choisir…</option>
              {villes.map((v) => (
                <option key={v.id} value={v.id}>{v.nom_fr} — {v.nom_ar}</option>
              ))}
            </NativeSelect>
          </Champ>

          <Champ label="Adresse" htmlFor="adresse" large>
            <Input id="adresse" name="adresse" defaultValue={c?.adresse ?? lieu?.adresse ?? ""} />
          </Champ>

          <Champ label="Téléphone" htmlFor="telephone">
            <Input id="telephone" name="telephone" type="tel" defaultValue={c?.telephone ?? lieu?.telephone ?? ""} />
          </Champ>
          <Champ label="Site / page Facebook" htmlFor="lien">
            <Input id="lien" name="lien" type="url" placeholder="https://" defaultValue={c?.lien ?? lieu?.lien ?? ""} />
          </Champ>

          <Champ label="Position GPS" htmlFor="gps" large>
            <Input
              id="gps"
              name="gps"
              value={gps}
              onChange={(e) => setGps(e.target.value)}
              placeholder="Collez un lien Google Maps ou « 36.8065, 10.1815 »"
            />
            <p className="text-xs text-muted-foreground">
              {gps === "" && "Dans Google Maps : clic droit sur le lieu → copier les coordonnées, puis collez ici."}
              {gps !== "" && coords && (
                <>
                  ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} —{" "}
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=18/${coords.lat}/${coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    vérifier sur la carte
                  </a>
                </>
              )}
              {gps !== "" && !coords && <span className="text-destructive">Format non reconnu.</span>}
            </p>
          </Champ>

          {etat.erreur && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">{etat.erreur}</p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="lg" disabled={enCours}>
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Link href="/admin/lieux" className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground hover:text-foreground">
              Annuler
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Champ({
  label,
  htmlFor,
  large,
  children,
}: {
  label: string;
  htmlFor: string;
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={large ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
