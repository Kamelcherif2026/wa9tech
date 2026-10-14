import { accueil, compteParVille, referentiels } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { BarreRecherche } from "@/components/public/barre-recherche";
import { GrilleEvenements } from "@/components/public/carte-evenement";
import { Section } from "@/components/public/section";
import { ALaUne } from "@/components/public/a-la-une";
import { Disciplines } from "@/components/public/disciplines";
import { CarteVilles } from "@/components/public/carte-villes";
import { Etoile, Porte } from "@/components/public/motifs";

export default async function Accueil() {
  const l = await langue();
  const d = t(l);
  const [{ villes, categories }, s, comptes] = await Promise.all([referentiels(), accueil(), compteParVille()]);
  const grille = (cartes: typeof s.bientot) => <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />;
  const dejaALaUne = new Set(s.aLaUne.map((e) => e.id));
  const suite = s.bientot.filter((e) => !dejaALaUne.has(e.id));
  const bientot = (suite.length ? suite : s.bientot).slice(0, 8);

  return (
    <>
      {/* Ouverture */}
      <section className="relative grid items-center gap-8 pt-10 sm:pt-14 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <p className="flex items-center gap-2 font-[family-name:var(--font-titre)] text-sm font-extrabold tracking-[0.2em] text-primary uppercase">
            <Etoile className="size-4 text-safran" /> {d.accroche}
          </p>
          <h1 className="mt-3 text-4xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl">
            {d.slogan}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">{d.sousSlogan}</p>
        </div>

        {/* Porte bleue de Sidi Bou Saïd, purement décorative */}
        <div aria-hidden="true" className="relative mx-auto hidden h-80 w-60 md:block">
          <span className="absolute -top-4 -end-8 size-24 rounded-full bg-safran" />
          <div className="arche motif-zellige absolute inset-0 overflow-hidden bg-bleu text-white shadow-xl [--motif-opacite:0.16]">
            <Porte className="absolute inset-x-6 top-6 bottom-0 h-[calc(100%-1.5rem)] w-[calc(100%-3rem)] text-white/30" />
            <p
              lang="ar"
              dir="rtl"
              className="absolute inset-x-0 bottom-5 text-center font-[family-name:var(--font-arabe)] text-5xl font-bold text-white drop-shadow"
            >
              وقتاش<span className="text-safran">؟</span>
            </p>
          </div>
          <span className="absolute -bottom-3 -start-6 h-5 w-28 -rotate-6 rounded-sm bg-terracotta" />
        </div>

        <div className="md:col-span-2">
          <BarreRecherche l={l} villes={villes} categories={categories} />
        </div>
      </section>

      <ALaUne cartes={s.aLaUne} l={l} villes={villes} categories={categories} />

      {s.aujourdhui.length > 0 && (
        <Section titre={d.ceSoir} lien={`/${l}/evenements?quand=aujourdhui`} libelleLien={d.voirTout}>{grille(s.aujourdhui)}</Section>
      )}
      {s.weekend.length > 0 && (
        <Section titre={d.ceWeekend} lien={`/${l}/evenements?quand=weekend`} libelleLien={d.voirTout}>{grille(s.weekend)}</Section>
      )}

      <div id="disciplines" className="scroll-mt-24">
        <Section titre={d.explorerCategories}>
          <Disciplines categories={categories} l={l} />
        </Section>
      </div>

      {s.sceneLocale.length > 0 && (
        <Section titre={d.sceneLocale} lien={`/${l}/categorie/live`} libelleLien={d.voirTout}>{grille(s.sceneLocale)}</Section>
      )}
      <Section titre={d.bientot} lien={`/${l}/evenements`} libelleLien={d.voirTout}>
        {s.bientot.length > 0 ? (
          grille(bientot)
        ) : (
          <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">{d.aucunResultat}</p>
        )}
      </Section>

      <div id="villes" className="scroll-mt-24">
        <Section titre={d.explorerVilles}>
          <CarteVilles villes={villes} comptes={comptes} l={l} />
        </Section>
      </div>
    </>
  );
}
