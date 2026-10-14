-- =====================================================================
-- WA9TECH — Migration 4 : tâches planifiées (pg_cron)
-- =====================================================================

create extension if not exists pg_cron;

-- R1 : mise à jour des prochaines dates, expiration et publications planifiées
select cron.schedule(
  'maj-dates-expiration',
  '*/15 * * * *',
  $$ select public.maj_dates_et_expiration(); $$
);

-- Purge des soumissions brutes de plus de 6 mois (vie privée)
select cron.schedule(
  'purge-soumissions',
  '30 3 * * *',
  $$ update public.soumission
        set expediteur = null, texte_brut = null
      where recue_le < now() - interval '6 months'
        and (expediteur is not null or texte_brut is not null); $$
);
