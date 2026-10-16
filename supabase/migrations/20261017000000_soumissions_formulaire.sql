-- =====================================================================
-- WA9TECH — Soumissions par le formulaire public « Proposer un événement »
-- =====================================================================

-- Nom de la personne qui propose, et empreinte (hachée) de son adresse IP
-- pour limiter les envois abusifs. Aucune IP en clair n'est stockée.
alter table public.soumission
  add column contact_nom text,
  add column ip_hash     text;

create index soumission_ip_recente_idx on public.soumission (ip_hash, recue_le desc)
  where ip_hash is not null;

create index soumission_recue_idx on public.soumission (recue_le desc);

-- La purge des données personnelles (6 mois) couvre aussi les nouvelles colonnes
-- (cron.schedule remplace la tâche du même nom).
select cron.schedule(
  'purge-soumissions',
  '30 3 * * *',
  $$ update public.soumission
        set expediteur = null, texte_brut = null, contact_nom = null, ip_hash = null
      where recue_le < now() - interval '6 months'
        and (expediteur is not null or texte_brut is not null or contact_nom is not null or ip_hash is not null); $$
);
