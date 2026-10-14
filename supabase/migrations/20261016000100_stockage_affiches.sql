-- =====================================================================
-- WA9TECH — Migration 6 : stockage des affiches (Supabase Storage)
-- Bucket public en lecture ; écriture réservée au staff (Sprint 1),
-- étendue aux contributeurs au Sprint 2.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('affiches', 'affiches', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy affiches_staff_ajout on storage.objects
  for insert to authenticated
  with check (bucket_id = 'affiches' and public.est_staff());

create policy affiches_staff_maj on storage.objects
  for update to authenticated
  using (bucket_id = 'affiches' and public.est_staff());

create policy affiches_staff_suppression on storage.objects
  for delete to authenticated
  using (bucket_id = 'affiches' and public.est_staff());
