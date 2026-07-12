insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-assets',
  'lesson-assets',
  false,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lesson participants read assets" on storage.objects;
create policy "lesson participants read assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.can_access_lesson(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "lesson participants upload assets" on storage.objects;
create policy "lesson participants upload assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lesson-assets'
  and public.can_access_lesson(((storage.foldername(name))[1])::uuid)
);
