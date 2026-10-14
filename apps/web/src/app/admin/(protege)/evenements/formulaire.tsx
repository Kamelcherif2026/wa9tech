"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { enregistrerEvenement } from "./actions";
import { envoyerAffiche } from "@/lib/images";
import { isoVersLocal } from "@/lib/dates";
import { PORTEES, type Categorie, type Evenement, type Ville } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface OptionLieu {
  id: string;
  nom: string;
  ville: string;
}
export interface OptionOrganisateur {
  id: string;
  nom: string;
}

interface Props {
  evenement?: Evenement;
  categories: Categorie[];
  lieux: OptionLieu[];
  organisateurs: OptionOrganisateur[];
  villes: Ville[];
}

type LigneDate = { debut: string; fin: string };

export function FormulaireEvenement({ evenement: e, categories, lieux, organisateurs, villes }: Props) {
  const [etat, action, enCours] = useActionState(enregistrerEvenement, {});
  const c = etat.champs;

  const [images, setImages] = useState<string[]>(c?.images ? JSON.parse(c.images) : (e?.images ?? []));
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurImage, setErreurImage] = useState<string | null>(null);

  const datesInitiales: LigneDate[] = c?.representations
    ? JSON.parse(c.representations)
    : e?.representations?.length
      ? e.representations.map((r) => ({ debut: isoVersLocal(r.debut), fin: r.fin ? isoVersLocal(r.fin) : "" }))
      : [{ debut: "", fin: "" }];
  const [dates, setDates] = useState<LigneDate[]>(datesInitiales);

  const [modeLieu, setModeLieu] = useState<"liste" | "libre">(
    (c?.lieu_texte ?? e?.lieu_texte) && !(c?.lieu_id ?? e?.lieu_id) ? "libre" : "liste",
  );
  const [gratuit, setGratuit] = useState(c ? c.gratuit === "on" : (e?.gratuit ?? false));

  const parents = categories.filter((x) => x.parent_id === null);

  async function ajouterImages(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setErreurImage(null);
    setEnvoiEnCours(true);
    try {
      const restantes = 5 - images.length;
      const urls: string[] = [];
      for (const f of Array.from(fichiers).slice(0, restantes)) {
        urls.push(await envoyerAffiche(f));
      }
      setImages((avant) => [...avant, ...urls]);
    } catch (err) {
      setErreurImage(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const majDate = (i: number, champ: keyof LigneDate, valeur: string) =>
    setDates((d) => d.map((x, j) => (j === i ? { ...x, [champ]: valeur } : x)));

  return (
    <form action={action} className="grid max-w-4xl gap-6">
      <input type="hidden" name="id" value={e?.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="representations" value={JSON.stringify(dates)} />

      {/* --- Informations principales --- */}
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Champ label="Titre *" id="titre_fr">
            <Input id="titre_fr" name="titre_fr" required defaultValue={c?.titre_fr ?? e?.titre_fr} />
          </Champ>
          <Champ label="Titre en arabe" id="titre_ar">
            <Input id="titre_ar" name="titre_ar" dir="rtl" defaultValue={c?.titre_ar ?? e?.titre_ar ?? ""} />
          </Champ>
          <Champ label="Catégorie *" id="categorie_id">
            <NativeSelect id="categorie_id" name="categorie_id" required defaultValue={c?.categorie_id ?? (e ? String(e.categorie_id) : "")}>
              <option value="" disabled>Choisir…</option>
              {parents.map((p) => (
                <optgroup key={p.id} label={p.libelle_fr}>
                  <option value={p.id}>{p.libelle_fr} (général)</option>
                  {categories
                    .filter((s) => s.parent_id === p.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.libelle_fr}</option>
                    ))}
                </optgroup>
              ))}
            </NativeSelect>
          </Champ>
          <Champ label="Portée" id="portee">
            <NativeSelect id="portee" name="portee" defaultValue={c?.portee ?? e?.portee ?? "locale"}>
              {Object.entries(PORTEES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </NativeSelect>
          </Champ>
          <Champ label="Organisateur" id="organisateur_id" large>
            <NativeSelect id="organisateur_id" name="organisateur_id" defaultValue={c?.organisateur_id ?? e?.organisateur_id ?? ""}>
              <option value="">— Aucun / inconnu —</option>
              {organisateurs.map((o) => (
                <option key={o.id} value={o.id}>{o.nom}</option>
              ))}
            </NativeSelect>
          </Champ>
          <Champ label="Description" id="description_fr" large>
            <Textarea id="description_fr" name="description_fr" rows={5} defaultValue={c?.description_fr ?? e?.description_fr ?? ""} />
          </Champ>
          <Champ label="Description en arabe" id="description_ar" large>
            <Textarea id="description_ar" name="description_ar" dir="rtl" rows={4} defaultValue={c?.description_ar ?? e?.description_ar ?? ""} />
          </Champ>
        </CardContent>
      </Card>

      {/* --- Lieu --- */}
      <Card>
        <CardHeader><CardTitle>Lieu</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={modeLieu === "liste"} onChange={() => setModeLieu("liste")} /> Lieu référencé
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={modeLieu === "libre"} onChange={() => setModeLieu("libre")} /> Adresse libre
            </label>
          </div>
          {modeLieu === "liste" ? (
            <>
              <NativeSelect name="lieu_id" defaultValue={c?.lieu_id ?? e?.lieu_id ?? ""}>
                <option value="">Choisir un lieu…</option>
                {lieux.map((l) => (
                  <option key={l.id} value={l.id}>{l.nom} — {l.ville}</option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                Lieu absent ? <Link href="/admin/lieux/nouveau" target="_blank" className="text-primary hover:underline">Créez-le</Link> puis rechargez cette page.
              </p>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="lieu_texte" placeholder="Ex. : Café X, rue Y, Gabès" defaultValue={c?.lieu_texte ?? e?.lieu_texte ?? ""} />
              <NativeSelect name="ville_id" defaultValue={c?.ville_id ?? (e?.ville_id ? String(e.ville_id) : "")}>
                <option value="">Ville…</option>
                {villes.map((v) => (
                  <option key={v.id} value={v.id}>{v.nom_fr}</option>
                ))}
              </NativeSelect>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Dates --- */}
      <Card>
        <CardHeader><CardTitle>Dates et horaires (heure de Tunis)</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {dates.map((d, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Début *</Label>
                <Input type="datetime-local" value={d.debut} onChange={(ev) => majDate(i, "debut", ev.target.value)} className="w-56" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fin (facultatif)</Label>
                <Input type="datetime-local" value={d.fin} onChange={(ev) => majDate(i, "fin", ev.target.value)} className="w-56" />
              </div>
              {dates.length > 1 && (
                <Button type="button" variant="ghost" size="icon-lg" aria-label="Supprimer cette date"
                  onClick={() => setDates((x) => x.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" onClick={() => setDates((x) => [...x, { debut: "", fin: "" }])}>
              <Plus /> Ajouter une représentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Prix et réservation --- */}
      <Card>
        <CardHeader><CardTitle>Prix et réservation</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="gratuit" checked={gratuit} onChange={(ev) => setGratuit(ev.target.checked)} />
            Entrée gratuite
          </label>
          {!gratuit && (
            <>
              <Champ label="Prix minimum (DT)" id="prix_min">
                <Input id="prix_min" name="prix_min" inputMode="decimal" defaultValue={c?.prix_min ?? e?.prix_min ?? ""} />
              </Champ>
              <Champ label="Prix maximum (DT)" id="prix_max">
                <Input id="prix_max" name="prix_max" inputMode="decimal" defaultValue={c?.prix_max ?? e?.prix_max ?? ""} />
              </Champ>
            </>
          )}
          <Champ label="Téléphone de réservation" id="telephone_reservation">
            <Input id="telephone_reservation" name="telephone_reservation" type="tel" defaultValue={c?.telephone_reservation ?? e?.telephone_reservation ?? ""} />
          </Champ>
          <Champ label="Lien (billetterie, Facebook…)" id="lien_externe">
            <Input id="lien_externe" name="lien_externe" type="url" placeholder="https://" defaultValue={c?.lien_externe ?? e?.lien_externe ?? ""} />
          </Champ>
          <Champ label="Comment réserver / y assister" id="infos_reservation" large>
            <Textarea id="infos_reservation" name="infos_reservation" rows={3}
              placeholder="Ex. : billets au guichet du théâtre à partir de 18h, ou par téléphone."
              defaultValue={c?.infos_reservation ?? e?.infos_reservation ?? ""} />
          </Champ>
        </CardContent>
      </Card>

      {/* --- Affiches --- */}
      <Card>
        <CardHeader><CardTitle>Affiche et images (1 à 5)</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Image ${i + 1}`} className="h-36 w-28 rounded-lg border object-cover" />
                <button type="button" aria-label="Retirer"
                  onClick={() => setImages((x) => x.filter((u) => u !== url))}
                  className="absolute -top-2 -right-2 rounded-full border bg-card p-1 shadow-sm hover:text-destructive">
                  <X className="size-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">principale</span>}
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-36 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary">
                <ImagePlus className="size-5" />
                {envoiEnCours ? "Envoi…" : "Ajouter"}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
                  disabled={envoiEnCours} onChange={(ev) => ajouterImages(ev.target.files)} />
              </label>
            )}
          </div>
          {erreurImage && <p className="text-sm text-destructive">Image : {erreurImage}</p>}
          <p className="text-xs text-muted-foreground">Les images sont redimensionnées et converties automatiquement (WebP).</p>
        </CardContent>
      </Card>

      {etat.erreur && <p role="alert" className="text-sm text-destructive">{etat.erreur}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={enCours || envoiEnCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Link href="/admin/evenements" className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground hover:text-foreground">
          Annuler
        </Link>
      </div>
    </form>
  );
}

function Champ({ label, id, large, children }: { label: string; id: string; large?: boolean; children: React.ReactNode }) {
  return (
    <div className={large ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
