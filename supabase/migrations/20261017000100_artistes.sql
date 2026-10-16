-- =====================================================================
-- WA9TECH — Artistes : ordre d'affiche, recherche, rapprochement
-- =====================================================================

-- Ordre d'apparition sur l'affiche (0 = tête d'affiche)
alter table public.evenement_artiste add column ordre smallint not null default 0;

create index artiste_nom_norm_trgm on public.artiste
  using gin (public.normaliser(nom) extensions.gin_trgm_ops);

-- Recherche d'artistes pour le sélecteur du back-office (FR ou AR, approximative)
create or replace function public.rechercher_artistes(p_q text, p_limite int default 8)
returns table (id uuid, slug text, nom text, nom_ar text, nb_evenements int)
language sql stable
set search_path = public, extensions
as $$
  with q as (select public.normaliser(p_q) as n)
  select a.id, a.slug, a.nom, a.nom_ar,
         (select count(*)::int from public.evenement_artiste ea where ea.artiste_id = a.id)
    from public.artiste a, q
   where q.n <> ''
     and (strpos(public.normaliser(a.nom), q.n) > 0
          or strpos(public.normaliser(a.nom_ar), q.n) > 0
          or similarity(public.normaliser(a.nom), q.n) > 0.4
          or word_similarity(q.n, public.normaliser(a.nom)) > 0.45)
   order by (public.normaliser(a.nom) = q.n or public.normaliser(a.nom_ar) = q.n) desc,
            (strpos(public.normaliser(a.nom), q.n) = 1) desc,
            word_similarity(q.n, public.normaliser(a.nom)) desc,
            a.nom
   limit least(greatest(coalesce(p_limite, 8), 1), 20);
$$;

-- Retrouve un artiste par son nom (accents, casse et variantes arabes ignorés),
-- ou le crée. Droits : ceux de l'appelant (staff, ou clé service pour l'import IA).
create or replace function public.rapprocher_artiste(p_nom text)
returns uuid
language plpgsql
set search_path = public, extensions
as $$
declare
  v_nom text := btrim(regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g'));
  v_n   text;
  v_id  uuid;
begin
  if v_nom = '' or length(v_nom) > 120 then
    return null;
  end if;
  v_n := public.normaliser(v_nom);

  select a.id into v_id
    from public.artiste a
   where public.normaliser(a.nom) = v_n
      or public.normaliser(a.nom_ar) = v_n
      or similarity(public.normaliser(a.nom), v_n) >= 0.8
   order by (public.normaliser(a.nom) = v_n or public.normaliser(a.nom_ar) = v_n) desc,
            similarity(public.normaliser(a.nom), v_n) desc
   limit 1;

  if v_id is null then
    insert into public.artiste (nom, nom_ar)
    values (v_nom, case when v_nom ~ '[ء-ي]' then v_nom end)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Remplace la liste des artistes d'un événement, dans l'ordre donné.
create or replace function public.definir_artistes(p_evenement uuid, p_artistes uuid[])
returns void
language sql
set search_path = public
as $$
  delete from public.evenement_artiste
   where evenement_id = p_evenement
     and artiste_id <> all (coalesce(p_artistes, '{}'));

  insert into public.evenement_artiste (evenement_id, artiste_id, ordre)
  select p_evenement, t.a, (min(t.o) - 1)::smallint
    from unnest(coalesce(p_artistes, '{}')) with ordinality as t(a, o)
   where t.a is not null
   group by t.a
  on conflict (evenement_id, artiste_id) do update set ordre = excluded.ordre;
$$;
