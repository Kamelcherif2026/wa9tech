import { accueil, referentiels } from "@/lib/public/requetes";
import { langue } from "@/lib/public/langue";
import { t } from "@/lib/i18n";
import { BarreRecherche } from "@/components/public/barre-recherche";
import { GrilleEvenements } from "@/components/public/carte-evenement";
import { Section } from "@/components/public/section";

export default async function Accueil() {
  const l = await langue();
  const d = t(l);
  const [{ villes, categories }, s] = await Promise.all([referentiels(), accueil()]);
  const grille = (cartes: typeof s.bientot) => <GrilleEvenements cartes={cartes} l={l} villes={villes} categories={categories} />;

  return (
    <>
      <section className="pt-10 pb-2 sm:pt-16">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
          {d.slogan}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{d.sousSlogan}</p>
        <div className="mt-6">
          <BarreRecherche l={l} villes={villes} categories={categories} />
        </div>
      </section>

      {s.aLaUne.length > 0 && <Section titre={d.aLaUne}>{grille(s.aLaUne)}</Section>}
      {s.aujourdhui.length > 0 && (
        <Section titre={d.ceSoir} lien={`/${l}/evenements?quand=aujourdhui`} libelleLien={d.voirTout}>{grille(s.aujourdhui)}</Section>
      )}
      {s.weekend.length > 0 && (
        <Section titre={d.ceWeekend} lien={`/${l}/evenements?quand=weekend`} libelleLien={d.voirTout}>{grille(s.weekend)}</Section>
      )}
      {s.sceneLocale.length > 0 && (
        <Section titre={d.sceneLocale} lien={`/${l}/categorie/live`} libelleLien={d.voirTout}>{grille(s.sceneLocale)}</Section>
      )}
      <Section titre={d.bientot} lien={`/${l}/evenements`} libelleLien={d.voirTout}>
        {s.bientot.length > 0 ? grille(s.bientot) : <p className="text-muted-foreground">{d.aucunResultat}</p>}
      </Section>

      <Section titre={d.villes}>
        <div className="flex flex-wrap gap-2">
          {villes.map((v) => (
            <a key={v.slug} href={`/${l}/ville/${v.slug}`} className="rounded-full border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
              {l === "ar" ? v.nom_ar : v.nom_fr}
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
