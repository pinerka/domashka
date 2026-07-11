-- Avoid recursive RLS checks between lessons and lesson_participants.
-- This function runs with the owner's privileges and only answers whether the
-- signed-in user participates in a particular lesson.
create or replace function public.can_access_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_role('admin')
    or exists (
      select 1
      from public.lesson_participants lp
      where lp.lesson_id = target_lesson_id
        and lp.user_id = auth.uid()
    );
$$;

revoke all on function public.can_access_lesson(uuid) from public;
grant execute on function public.can_access_lesson(uuid) to authenticated;

drop policy if exists "lessons visible to participants" on public.lessons;
create policy "lessons visible to participants"
on public.lessons for select to authenticated
using (public.can_access_lesson(id));

drop policy if exists "lesson participants visible to same lesson" on public.lesson_participants;
create policy "lesson participants visible to same lesson"
on public.lesson_participants for select to authenticated
using (public.can_access_lesson(lesson_id));
