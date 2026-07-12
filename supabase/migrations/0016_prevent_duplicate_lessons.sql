-- Remove existing accidental duplicate bookings and their duplicate lessons,
-- keeping the oldest booking for each teacher/student/time combination.
with ranked_bookings as (
  select
    id,
    row_number() over (
      partition by teacher_id, student_id, starts_at
      order by created_at, id
    ) as duplicate_number
  from public.bookings
  where teacher_id is not null and student_id is not null
), duplicate_bookings as (
  select id from ranked_bookings where duplicate_number > 1
)
delete from public.lessons lesson
using duplicate_bookings duplicate
where lesson.booking_id = duplicate.id;

with ranked_bookings as (
  select
    id,
    row_number() over (
      partition by teacher_id, student_id, starts_at
      order by created_at, id
    ) as duplicate_number
  from public.bookings
  where teacher_id is not null and student_id is not null
), duplicate_bookings as (
  select id from ranked_bookings where duplicate_number > 1
)
delete from public.bookings booking
using duplicate_bookings duplicate
where booking.id = duplicate.id;

create unique index if not exists bookings_teacher_student_starts_unique
on public.bookings(teacher_id, student_id, starts_at)
where teacher_id is not null and student_id is not null;
