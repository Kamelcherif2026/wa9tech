// =====================================================================
// WA9TECH — Banc d'essai des modèles d'IA pour la lecture d'affiches
//
// Usage (depuis wa9tech/) :
//   node scripts/benchmark-ia/benchmark.mjs --lister          liste les modèles retenus et le coût estimé
//   node scripts/benchmark-ia/benchmark.mjs --oui             lance le test complet
//   node scripts/benchmark-ia/benchmark.mjs --oui --limite 5  test rapide sur 5 affiches
//   node scripts/benchmark-ia/benchmark.mjs --oui --modeles google/gemini-2.5-flash,openai/gpt-5-mini
//
// Clé : OPENROUTER_API_KEY dans apps/web/.env.local (ou variable d'environnement).
// =====================================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONSIGNE, SCHEMA, parentCategorie } from "./prompt.mjs";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "../..");
const API = process.env.OPENROUTER_BASE ?? "https://openrouter.ai/api/v1";

// ---------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------
const argv = process.argv.slice(2);
const opt = (nom, defaut) => {
  const i = argv.indexOf(`--${nom}`);
  return i === -1 ? defaut : (argv[i + 1] ?? true);
};
const LISTER = argv.includes("--lister");
const OUI = argv.includes("--oui");
const LIMITE = Number(opt("limite", 0)) || Infinity;
const CONCURRENCE = Number(opt("concurrence", 4));
const DOSSIER = path.resolve(RACINE, opt("dossier", "../affiches_test"));
const MODELES_IMPOSES = opt("modeles", null);
const DATE_DU_JOUR = opt("date", new Date().toISOString().slice(0, 10));
const RESCORER = opt("rescorer", null); // dossier de résultats à renoter sans nouvel appel

// Familles comparées par défaut : on prend le modèle le plus récent de chacune.
const FAMILLES = [
  { nom: "Gemini Flash", motif: /^google\/gemini-[\d.]+-flash(?!-lite)/ },
  { nom: "Gemini Flash-Lite", motif: /^google\/gemini-[\d.]+-flash-lite/ },
  { nom: "Gemini Pro", motif: /^google\/gemini-[\d.]+-pro/ },
  { nom: "GPT mini", motif: /^openai\/gpt-[\d.o]+(-\w+)?-mini/ },
  { nom: "Claude Haiku", motif: /^anthropic\/claude-.*haiku/ },
  { nom: "Claude Sonnet", motif: /^anthropic\/claude-.*sonnet/ },
  { nom: "Qwen VL", motif: /^qwen\/.*vl/ },
  { nom: "Mistral", motif: /^mistralai\/(mistral-medium|mistral-small|pixtral)/ },
];

// ---------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------
async function lireCle() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY.trim();
  try {
    const env = await fs.readFile(path.join(RACINE, "apps/web/.env.local"), "utf8");
    const ligne = env.split(/\r?\n/).find((l) => l.startsWith("OPENROUTER_API_KEY="));
    if (ligne) return ligne.slice("OPENROUTER_API_KEY=".length).trim();
  } catch {}
  throw new Error("Clé introuvable : ajoutez OPENROUTER_API_KEY=... dans apps/web/.env.local");
}

export function normaliser(t) {
  return String(t ?? "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}\p{N}' -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const contientUn = (texte, mots) => {
  const t = normaliser(texte);
  return mots.some((m) => t.includes(normaliser(m)));
};
const chiffres = (t) => String(t ?? "").replace(/\D/g, "").replace(/^216(?=\d{8}$)/, "");
const mediane = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)} %` : "—");

async function parallele(taches, n) {
  const resultats = new Array(taches.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < taches.length) {
        const k = i++;
        resultats[k] = await taches[k]();
      }
    }),
  );
  return resultats;
}

// ---------------------------------------------------------------------
// Modèles
// ---------------------------------------------------------------------
async function chargerModeles(cle) {
  const r = await fetch(`${API}/models`, { headers: { Authorization: `Bearer ${cle}` } });
  if (!r.ok) throw new Error(`OpenRouter /models : ${r.status}`);
  const { data } = await r.json();
  return data.filter((m) => {
    const arch = m.architecture ?? {};
    const entrees = arch.input_modalities ?? [];
    const sorties = arch.output_modalities ?? ["text"];
    return (
      entrees.includes("image") &&
      sorties.includes("text") &&
      !m.id.endsWith(":free") &&
      !/image-preview|-image\b|tts|audio|embed/.test(m.id)
    );
  });
}

function choisirModeles(tous) {
  if (MODELES_IMPOSES) {
    return String(MODELES_IMPOSES)
      .split(",")
      .map((id) => tous.find((m) => m.id === id.trim()) ?? { id: id.trim(), name: id.trim(), pricing: {} });
  }
  const choix = [];
  for (const f of FAMILLES) {
    const candidats = tous.filter((m) => f.motif.test(m.id)).sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    if (candidats[0]) choix.push({ ...candidats[0], famille: f.nom });
  }
  return choix;
}

function coutEstime(modele, nbImages) {
  const p = modele.pricing ?? {};
  const parAffiche =
    Number(p.prompt ?? 0) * 2500 + Number(p.completion ?? 0) * 700 + Number(p.image ?? 0) + Number(p.request ?? 0);
  return parAffiche * nbImages;
}

// ---------------------------------------------------------------------
// Appel au modèle
// ---------------------------------------------------------------------
async function extraire(cle, modele, image) {
  const contenu = [
    { type: "text", text: `Date du jour : ${DATE_DU_JOUR}. Analyse cette affiche.` },
    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image.base64}` } },
  ];
  const corps = (format) => ({
    model: modele.id,
    messages: [
      { role: "system", content: CONSIGNE },
      { role: "user", content: contenu },
    ],
    temperature: 0,
    max_tokens: 4000,
    response_format: format,
    usage: { include: true },
  });

  const debut = performance.now();
  let format = { type: "json_schema", json_schema: { name: "extraction_affiche", strict: true, schema: SCHEMA } };
  let reponse;
  for (let essai = 0; essai < 3; essai++) {
    reponse = await fetch(`${API}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wa9tech.tn",
        "X-Title": "WA9TECH benchmark",
      },
      body: JSON.stringify(corps(format)),
    });
    if (reponse.ok) break;
    const texte = await reponse.text();
    if (reponse.status === 400 && format.type === "json_schema") {
      // Modèle sans sortie structurée stricte : on retombe sur le mode JSON simple.
      format = { type: "json_object" };
      contenu[0].text += `\nRéponds avec un JSON conforme à ce schéma : ${JSON.stringify(SCHEMA)}`;
      continue;
    }
    if (reponse.status === 429 || reponse.status >= 500) {
      await new Promise((r) => setTimeout(r, 3000 * (essai + 1)));
      continue;
    }
    return { erreur: `HTTP ${reponse.status} : ${texte.slice(0, 200)}`, ms: performance.now() - debut };
  }
  if (!reponse.ok) return { erreur: `HTTP ${reponse.status}`, ms: performance.now() - debut };

  const donnees = await reponse.json();
  const ms = performance.now() - debut;
  const cout = Number(donnees.usage?.cost ?? 0);
  const brut = donnees.choices?.[0]?.message?.content ?? "";
  try {
    const texte = (typeof brut === "string" ? brut : brut.map((b) => b.text ?? "").join(""))
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    return { json: JSON.parse(texte), ms, cout };
  } catch {
    return { erreur: "JSON invalide", brut: String(brut).slice(0, 300), ms, cout };
  }
}

// ---------------------------------------------------------------------
// Notation
// ---------------------------------------------------------------------
function noter(verite, resultat) {
  const n = {}; // champ → true/false (absent = non applicable)
  if (!resultat.json) {
    n.json = false;
    return n;
  }
  n.json = true;
  const j = resultat.json;
  const evts = Array.isArray(j.evenements) ? j.evenements : [];
  n.est_evenement = Boolean(j.est_une_affiche_evenement) === verite.est_evenement;
  if (verite.nb_evenements > 1) n.multi = evts.length >= verite.nb_evenements;
  const e = evts[0];
  if (!e) return n;

  n.titre = contientUn(`${e.titre ?? ""} ${e.titre_ar ?? ""}`, verite.titre);

  const reps = Array.isArray(e.representations) ? e.representations : [];
  if (verite.dates) {
    n.date = reps.some((r) => {
      const d = String(r.date ?? "");
      return verite.dates.some((attendue) =>
        attendue.startsWith("--") ? d.slice(5) === attendue.slice(2) : d === attendue,
      );
    });
  } else {
    // Date absente ou illisible : le modèle ne doit rien inventer
    n.date = reps.every((r) => !r.date);
  }
  if (verite.date_fin) n.date_fin = reps.some((r) => r.date_fin === verite.date_fin);
  if (verite.heure) {
    const ok = Array.isArray(verite.heure) ? verite.heure : [verite.heure];
    n.heure = reps.some((r) => ok.includes(String(r.heure ?? "").slice(0, 5)));
  }
  if (verite.lieu) n.lieu = contientUn(`${e.lieu_nom ?? ""} ${e.adresse ?? ""}`, verite.lieu);
  if (verite.ville) n.ville = contientUn(`${e.ville ?? ""} ${e.lieu_nom ?? ""}`, verite.ville);
  if (verite.en_tunisie === false) n.en_tunisie = e.en_tunisie === false;
  if (verite.categorie) n.categorie = verite.categorie.includes(parentCategorie(e.categorie));
  if (verite.gratuit === true) n.prix = e.gratuit === true;
  else if (verite.prix_min != null) n.prix = Number(e.prix_min) === verite.prix_min || Number(e.prix_max) === verite.prix_min;
  if (verite.telephones) {
    const trouves = (e.telephones ?? []).map(chiffres);
    n.telephone = verite.telephones.some((t) => trouves.includes(t));
  }
  return n;
}

const CHAMPS = ["json", "est_evenement", "titre", "date", "date_fin", "heure", "lieu", "ville", "categorie", "prix", "telephone", "en_tunisie", "multi"];
// Poids pour le score global (les champs critiques pour la publication comptent double)
const POIDS = { titre: 2, date: 2, heure: 1, lieu: 1.5, ville: 1, categorie: 1, prix: 1, telephone: 0.5, date_fin: 0.5, en_tunisie: 0.5, multi: 0.5, est_evenement: 0.5 };

// ---------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------
async function main() {
  const { affiches } = JSON.parse(await fs.readFile(path.join(ICI, "verite.json"), "utf8"));
  if (RESCORER) {
    const dossier = path.resolve(ICI, "resultats", String(RESCORER));
    const { details } = JSON.parse(await fs.readFile(path.join(dossier, "resultats.json"), "utf8"));
    const fichiers = new Set(Object.values(details)[0].map((r) => r.fichier));
    await ecrireRapport(dossier, affiches.filter((v) => fichiers.has(v.fichier)), details);
    return;
  }
  const cle = await lireCle();
  const selection = affiches.slice(0, LIMITE);

  const tous = await chargerModeles(cle);
  const modeles = choisirModeles(tous);
  if (!modeles.length) throw new Error("Aucun modèle trouvé.");

  console.log(`\n${selection.length} affiches · dossier ${DOSSIER}\nModèles retenus :`);
  let total = 0;
  for (const m of modeles) {
    const c = coutEstime(m, selection.length);
    total += c;
    console.log(`  - ${m.id.padEnd(45)} ${m.famille ?? ""}  ≈ ${c.toFixed(3)} $`);
  }
  console.log(`Coût total estimé : ≈ ${total.toFixed(2)} $ (estimation large)\n`);

  if (LISTER) {
    console.log("Autres modèles « vision » disponibles :");
    tous.sort((a, b) => (b.created ?? 0) - (a.created ?? 0)).slice(0, 40).forEach((m) => console.log(`  ${m.id}`));
    return;
  }
  if (!OUI) {
    console.log("Ajoutez --oui pour lancer le test.");
    return;
  }

  const images = await Promise.all(
    selection.map(async (v) => ({ ...v, base64: (await fs.readFile(path.join(DOSSIER, v.fichier))).toString("base64") })),
  );

  const dossierSortie = path.join(ICI, "resultats", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));
  await fs.mkdir(dossierSortie, { recursive: true });

  const details = {};
  for (const modele of modeles) {
    process.stdout.write(`${modele.id} `);
    const resultats = await parallele(
      images.map((img) => async () => {
        const r = await extraire(cle, modele, img);
        process.stdout.write(r.json ? "." : "x");
        return { fichier: img.fichier, ...r };
      }),
      CONCURRENCE,
    );
    console.log("");
    details[modele.id] = resultats.map(({ fichier, json, erreur, brut, ms, cout }) => ({ fichier, ms: Math.round(ms), cout, erreur, brut, json }));
  }
  await ecrireRapport(dossierSortie, selection, details);
}

/** Calcule les scores et écrit resultats.json + rapport.md. */
async function ecrireRapport(dossierSortie, verites, details) {
  const parFichier = Object.fromEntries(verites.map((v) => [v.fichier, v]));
  const bilan = [];
  for (const [modele, resultats] of Object.entries(details)) {
    for (const r of resultats) r.notes = noter(parFichier[r.fichier], r);
    const ligne = { modele, champs: {} };
    let somme = 0;
    let poidsTotal = 0;
    for (const champ of CHAMPS) {
      const vals = resultats.map((r) => r.notes[champ]).filter((v) => v !== undefined);
      ligne.champs[champ] = { ok: vals.filter(Boolean).length, n: vals.length };
      if (POIDS[champ]) {
        for (const v of vals) {
          somme += (v ? 1 : 0) * POIDS[champ];
          poidsTotal += POIDS[champ];
        }
      }
    }
    ligne.score = poidsTotal ? (100 * somme) / poidsTotal : 0;
    ligne.latence = mediane(resultats.map((r) => r.ms));
    ligne.cout = resultats.reduce((s, r) => s + (r.cout ?? 0), 0);
    ligne.coutMille = (ligne.cout / resultats.length) * 1000;
    bilan.push(ligne);
  }
  bilan.sort((a, b) => b.score - a.score);
  await fs.writeFile(path.join(dossierSortie, "resultats.json"), JSON.stringify({ date: DATE_DU_JOUR, bilan, details }, null, 1));

  const entetes = ["Modèle", "Score", "JSON", "Titre", "Date", "Heure", "Lieu", "Ville", "Catég.", "Prix", "Tél.", "Latence", "Coût test", "Coût /1000"];
  const lignes = bilan.map((b) => {
    const c = (k) => pct(b.champs[k].ok, b.champs[k].n);
    return [
      b.modele, `**${b.score.toFixed(1)}**`, c("json"), c("titre"), c("date"), c("heure"), c("lieu"), c("ville"),
      c("categorie"), c("prix"), c("telephone"), `${(b.latence / 1000).toFixed(1)} s`, `${b.cout.toFixed(3)} $`, `${b.coutMille.toFixed(2)} $`,
    ];
  });
  const echecs = (m) =>
    details[m]
      .filter((d) => Object.values(d.notes).some((v) => v === false))
      .map((d) => `- **${d.fichier}** : ${Object.entries(d.notes).filter(([, v]) => v === false).map(([k]) => k).join(", ")}${d.erreur ? ` (${d.erreur})` : ""}`);
  const md = [
    `# Banc d'essai — lecture d'affiches (${DATE_DU_JOUR})`,
    "",
    `${verites.length} affiches · score pondéré (titre et date comptent double, lieu ×1,5).`,
    "",
    `| ${entetes.join(" | ")} |`,
    `|${entetes.map(() => "---").join("|")}|`,
    ...lignes.map((l) => `| ${l.join(" | ")} |`),
    "",
    ...bilan.slice(0, 3).flatMap((b) => [`## Échecs — ${b.modele}`, "", ...echecs(b.modele), ""]),
  ].join("\n");
  await fs.writeFile(path.join(dossierSortie, "rapport.md"), md);
  console.log(`\n${md}\n\nRésultats enregistrés dans ${dossierSortie}`);
}

main().catch((e) => {
  console.error(`\nErreur : ${e.message}`);
  process.exit(1);
});
