-- A lesson can be deleted by a signed-in participant (teacher or student).
drop policy if exists "participants delete own lessons" on public.lessons;
create policy "participants delete own lessons"
on public.lessons for delete to authenticated
using (public.can_access_lesson(id));
