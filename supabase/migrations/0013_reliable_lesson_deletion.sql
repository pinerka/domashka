-- Delete a lesson through a narrowly scoped security-definer function so RLS
-- cannot silently turn a participant's DELETE into a no-op.
create or replace function public.delete_own_lesson(target_lesson_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_access_lesson(target_lesson_id) then
    return false;
  end if;

  delete from public.lessons
  where id = target_lesson_id;

  return found;
end;
$$;

revoke all on function public.delete_own_lesson(uuid) from public;
grant execute on function public.delete_own_lesson(uuid) to authenticated;
