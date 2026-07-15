-- Persist the complete collaborative board for every lesson.
-- Access is limited to lesson participants through can_access_lesson().

create or replace function public.get_lesson_whiteboard(target_lesson_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  saved_snapshot jsonb;
begin
  if auth.uid() is null or not public.can_access_lesson(target_lesson_id) then
    raise exception 'You do not have access to this lesson';
  end if;

  select room.snapshot
  into saved_snapshot
  from public.whiteboard_rooms room
  where room.lesson_id = target_lesson_id;

  return coalesce(saved_snapshot, '{}'::jsonb);
end;
$$;

create or replace function public.save_lesson_whiteboard(
  target_lesson_id uuid,
  target_snapshot jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_access_lesson(target_lesson_id) then
    raise exception 'You do not have access to this lesson';
  end if;

  if target_snapshot is null or jsonb_typeof(target_snapshot) <> 'object' then
    raise exception 'Whiteboard snapshot must be a JSON object';
  end if;

  insert into public.whiteboard_rooms (lesson_id, snapshot, updated_at)
  values (target_lesson_id, target_snapshot, now())
  on conflict (lesson_id) do update
    set snapshot = excluded.snapshot,
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.get_lesson_whiteboard(uuid) from public;
revoke all on function public.save_lesson_whiteboard(uuid, jsonb) from public;
grant execute on function public.get_lesson_whiteboard(uuid) to authenticated;
grant execute on function public.save_lesson_whiteboard(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
