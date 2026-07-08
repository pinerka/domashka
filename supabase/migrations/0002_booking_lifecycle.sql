create or replace function public.create_lesson_after_booking_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_lesson_id uuid;
  teacher_user_id uuid;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    select user_id into teacher_user_id
    from public.teacher_profiles
    where id = new.teacher_id;

    insert into public.lessons (booking_id, teacher_id, title, starts_at, ends_at, status, video_provider)
    values (new.id, new.teacher_id, 'Online lesson', new.starts_at, new.ends_at, 'scheduled', 'jitsi')
    on conflict (booking_id) do update
      set starts_at = excluded.starts_at,
          ends_at = excluded.ends_at,
          status = 'scheduled',
          updated_at = now()
    returning id into new_lesson_id;

    insert into public.lesson_participants (lesson_id, user_id, role)
    values
      (new_lesson_id, new.student_id, 'student'),
      (new_lesson_id, teacher_user_id, 'teacher')
    on conflict (lesson_id, user_id) do nothing;

    insert into public.whiteboard_rooms (lesson_id)
    values (new_lesson_id)
    on conflict (lesson_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_booking_confirmed_create_lesson on public.bookings;

create trigger on_booking_confirmed_create_lesson
after update of status on public.bookings
for each row
execute function public.create_lesson_after_booking_confirmed();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger touch_teacher_profiles_updated_at
before update on public.teacher_profiles
for each row execute function public.touch_updated_at();

create trigger touch_bookings_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

create trigger touch_lessons_updated_at
before update on public.lessons
for each row execute function public.touch_updated_at();
