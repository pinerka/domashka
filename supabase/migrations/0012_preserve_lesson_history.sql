-- Keep lesson history when either account is permanently deleted.
alter table public.bookings alter column student_id drop not null;
alter table public.bookings alter column teacher_id drop not null;
alter table public.bookings drop constraint if exists bookings_student_id_fkey;
alter table public.bookings drop constraint if exists bookings_teacher_id_fkey;
alter table public.bookings add constraint bookings_student_id_fkey foreign key (student_id) references public.profiles(id) on delete set null;
alter table public.bookings add constraint bookings_teacher_id_fkey foreign key (teacher_id) references public.teacher_profiles(id) on delete set null;

alter table public.lessons alter column teacher_id drop not null;
alter table public.lessons drop constraint if exists lessons_teacher_id_fkey;
alter table public.lessons add constraint lessons_teacher_id_fkey foreign key (teacher_id) references public.teacher_profiles(id) on delete set null;

alter table public.lesson_participants alter column user_id drop not null;
alter table public.lesson_participants drop constraint if exists lesson_participants_user_id_fkey;
alter table public.lesson_participants add constraint lesson_participants_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.whiteboard_events alter column user_id drop not null;
alter table public.whiteboard_events drop constraint if exists whiteboard_events_user_id_fkey;
alter table public.whiteboard_events add constraint whiteboard_events_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.lesson_messages alter column sender_id drop not null;
alter table public.lesson_messages drop constraint if exists lesson_messages_sender_id_fkey;
alter table public.lesson_messages add constraint lesson_messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;

alter table public.reviews alter column author_id drop not null;
alter table public.reviews alter column teacher_id drop not null;
alter table public.reviews drop constraint if exists reviews_author_id_fkey;
alter table public.reviews drop constraint if exists reviews_teacher_id_fkey;
alter table public.reviews add constraint reviews_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.reviews add constraint reviews_teacher_id_fkey foreign key (teacher_id) references public.teacher_profiles(id) on delete set null;

alter table public.lessons add column if not exists teacher_name_snapshot text;
alter table public.lessons add column if not exists student_name_snapshot text;

update public.lessons lesson
set teacher_name_snapshot = profile.full_name
from public.teacher_profiles teacher
join public.profiles profile on profile.id = teacher.user_id
where lesson.teacher_id = teacher.id
  and lesson.teacher_name_snapshot is null;

update public.lessons lesson
set student_name_snapshot = profile.full_name
from public.bookings booking
join public.profiles profile on profile.id = booking.student_id
where lesson.booking_id = booking.id
  and lesson.student_name_snapshot is null;

create or replace function public.capture_lesson_names()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.teacher_name_snapshot is null and new.teacher_id is not null then
    select profile.full_name into new.teacher_name_snapshot
    from public.teacher_profiles teacher
    join public.profiles profile on profile.id = teacher.user_id
    where teacher.id = new.teacher_id;
  end if;

  if new.student_name_snapshot is null and new.booking_id is not null then
    select profile.full_name into new.student_name_snapshot
    from public.bookings booking
    join public.profiles profile on profile.id = booking.student_id
    where booking.id = new.booking_id;
  end if;

  return new;
end;
$$;

drop trigger if exists capture_lesson_names on public.lessons;
create trigger capture_lesson_names
before insert or update of teacher_id, booking_id on public.lessons
for each row execute function public.capture_lesson_names();
