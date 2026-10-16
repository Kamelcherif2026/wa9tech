"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Mic2, Plus, Star, X } from "lucide-react";
import { chercherArtistes, type ArtisteTrouve } from "@/app/admin/(protege)/artistes/actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Artiste choisi : « id » absent = nouvel artiste, créé à l'enregistrement de l'événement. */
export interface ArtisteChoisi {
  id?: string;
  nom: string;
  nom_ar?: string | null;
}

const normaliser = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function SelecteurArtistes({ initiaux, nom = "artistes" }: { initiaux: ArtisteChoisi[]; nom?: string }) {
  const [choisis, setChoisis] = useState<ArtisteChoisi[]>(initiaux);
  const [saisie, setSaisie] = useState("");
  const [trouves, setSuggestions] = useState<ArtisteTrouve[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const [recherche, demarrer] = useTransition();
  const idListe = useId();
  const champ = useRef<HTMLInputElement>(null);

  // Recherche avec un léger délai pendant la frappe
  useEffect(() => {
    const terme = saisie.trim();
    if (terme.length < 2) return;
    const minuteur = setTimeout(() => {
      demarrer(async () => {
        const r = await chercherArtistes(terme);
        setSuggestions(r.filter((a) => !choisis.some((c) => c.id === a.id)));
        setActif(0);
      });
    }, 250);
    return () => clearTimeout(minuteur);
  }, [saisie, choisis]);

  // Moins de 2 lettres : pas de suggestions (dérivé, sans effet)
  const suggestions = saisie.trim().length >= 2 ? trouves : [];
  const exact = suggestions.some((s) => normaliser(s.nom) === normaliser(saisie) || normaliser(s.nom_ar ?? "") === normaliser(saisie));
  const dejaChoisi = choisis.some((c) => normaliser(c.nom) === normaliser(saisie));
  const peutCreer = saisie.trim().length >= 2 && !exact && !dejaChoisi;
  const options: (ArtisteTrouve | "creer")[] = [...suggestions, ...(peutCreer ? (["creer"] as const) : [])];

  function ajouter(o: ArtisteTrouve | "creer") {
    const a: ArtisteChoisi = o === "creer" ? { nom: saisie.trim().replace(/\s+/g, " ") } : { id: o.id, nom: o.nom, nom_ar: o.nom_ar };
    setChoisis((l) => [...l, a]);
    setSaisie("");
    setSuggestions([]);
    champ.current?.focus();
  }

  const deplacer = (i: number, sens: -1 | 1) =>
    setChoisis((l) => {
      const j = i + sens;
      if (j < 0 || j >= l.length) return l;
      const copie = [...l];
      [copie[i], copie[j]] = [copie[j], copie[i]];
      return copie;
    });

  return (
    <div className="grid gap-3">
      <input type="hidden" name={nom} value={JSON.stringify(choisis)} />

      {choisis.length > 0 && (
        <ol className="grid gap-1.5">
          {choisis.map((a, i) => (
            <li key={`${a.id ?? "nouveau"}-${a.nom}`} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
              {i === 0 ? <Star className="size-4 shrink-0 fill-safran text-safran" aria-label="Tête d'affiche" /> : <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>}
              <span className="font-medium">{a.nom}</span>
              {a.nom_ar && a.nom_ar !== a.nom && <span dir="rtl" className="text-muted-foreground">{a.nom_ar}</span>}
              {!a.id && <span className="rounded bg-accent px-1.5 text-xs text-accent-foreground">nouveau</span>}
              <span className="ms-auto flex items-center">
                <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter" className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => deplacer(i, 1)} disabled={i === choisis.length - 1} aria-label="Descendre" className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => setChoisis((l) => l.filter((_, j) => j !== i))} aria-label={`Retirer ${a.nom}`} className="rounded p-1 hover:bg-muted hover:text-destructive"><X className="size-4" /></button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="relative">
        <Mic2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={champ}
          value={saisie}
          onChange={(e) => { setSaisie(e.target.value); setOuvert(true); }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActif((a) => Math.min(a + 1, options.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActif((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter") {
              e.preventDefault(); // ne pas envoyer le formulaire
              if (options[actif]) ajouter(options[actif]);
            } else if (e.key === "Escape") setOuvert(false);
          }}
          placeholder="Ajouter un artiste (nom en français ou en arabe)…"
          className="ps-9"
          role="combobox"
          aria-expanded={ouvert && options.length > 0}
          aria-controls={idListe}
          aria-autocomplete="list"
        />
        {recherche && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}

        {ouvert && options.length > 0 && (
          <ul id={idListe} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
            {options.map((o, i) => (
              <li
                key={o === "creer" ? "creer" : o.id}
                role="option"
                aria-selected={i === actif}
                onMouseDown={(e) => { e.preventDefault(); ajouter(o); }}
                onMouseEnter={() => setActif(i)}
                className={cn("flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm", i === actif && "bg-accent text-accent-foreground")}
              >
                {o === "creer" ? (
                  <><Plus className="size-4" /> Créer l&apos;artiste « <strong>{saisie.trim()}</strong> »</>
                ) : (
                  <>
                    <span className="font-medium">{o.nom}</span>
                    {o.nom_ar && o.nom_ar !== o.nom && <span dir="rtl" className="text-muted-foreground">{o.nom_ar}</span>}
                    <span className="ms-auto text-xs text-muted-foreground">{o.nb_evenements} évén.</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Le premier de la liste est la tête d&apos;affiche. Tapez au moins 2 lettres ; Entrée pour ajouter, flèches pour choisir.
      </p>
    </div>
  );
}
