-- Recreate the public RPC functions in one migration and force PostgREST to
-- refresh its schema cache. Run 0012 before this migration.
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

  delete from public.lessons where id = target_lesson_id;
  return found;
end;
$$;

create or replace function public.finish_own_lesson(target_lesson_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.lessons lesson
    join public.teacher_profiles teacher on teacher.id = lesson.teacher_id
    where lesson.id = target_lesson_id
      and teacher.user_id = auth.uid()
  ) then
    return false;
  end if;

  update public.lessons
  set status = 'completed', updated_at = now()
  where id = target_lesson_id;

  return found;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'teacher_name_snapshot'
  ) then
    raise exception 'Run migration 0012 before deleting accounts';
  end if;

  delete from auth.users where id = current_user_id;
  if not found then raise exception 'Account not found'; end if;
end;
$$;

revoke all on function public.delete_own_lesson(uuid) from public;
revoke all on function public.finish_own_lesson(uuid) from public;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_lesson(uuid) to authenticated;
grant execute on function public.finish_own_lesson(uuid) to authenticated;
grant execute on function public.delete_own_account() to authenticated;

notify pgrst, 'reload schema';
