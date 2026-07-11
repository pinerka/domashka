-- Let any lesson participant persist a missing Daily room URL without granting
-- broad update access to the lessons table.
create or replace function public.save_lesson_video_room(
  target_lesson_id uuid,
  target_room_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_access_lesson(target_lesson_id) then
    raise exception 'Access denied';
  end if;

  if target_room_url is null or target_room_url !~ '^https://[a-z0-9-]+\.daily\.co/' then
    raise exception 'Invalid Daily room URL';
  end if;

  update public.lessons
  set video_provider = 'daily',
      video_room_url = target_room_url,
      updated_at = now()
  where id = target_lesson_id
    and video_room_url is null;
end;
$$;

revoke all on function public.save_lesson_video_room(uuid, text) from public;
grant execute on function public.save_lesson_video_room(uuid, text) to authenticated;
