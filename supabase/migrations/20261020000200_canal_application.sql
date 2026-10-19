-- =====================================================================
-- « Proposer un événement » depuis l'application mobile : nouveau canal,
-- distinct du formulaire du site (filtre dans le back-office).
-- =====================================================================

alter type public.source_soumission add value if not exists 'application' after 'formulaire';
