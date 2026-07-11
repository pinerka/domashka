create table if not exists public.teacher_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

alter table public.teacher_students enable row level security;

create index if not exists teacher_students_teacher_idx on public.teacher_students(teacher_id);
create index if not exists teacher_students_student_idx on public.teacher_students(student_id);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teacher_students' and policyname = 'teacher student links visible to parties'
  ) then
    create policy "teacher student links visible to parties"
    on public.teacher_students for select to authenticated
    using (
      student_id = auth.uid()
      or exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid())
      or public.has_role('admin')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teacher_students' and policyname = 'teachers add own students'
  ) then
    create policy "teachers add own students"
    on public.teacher_students for insert to authenticated
    with check (
      exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid())
      and exists (select 1 from public.user_roles ur where ur.user_id = student_id and ur.role = 'student')
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teacher_students' and policyname = 'teachers update own students'
  ) then
    create policy "teachers update own students"
    on public.teacher_students for update to authenticated
    using (exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid()))
    with check (exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'teachers invite own students'
  ) then
    create policy "teachers invite own students"
    on public.bookings for insert to authenticated
    with check (
      exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid())
      and exists (
        select 1 from public.teacher_students ts
        where ts.teacher_id = teacher_id and ts.student_id = student_id and ts.status = 'active'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'teachers update own bookings'
  ) then
    create policy "teachers update own bookings"
    on public.bookings for update to authenticated
    using (exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid()))
    with check (exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lessons' and policyname = 'teachers update own lessons'
  ) then
    create policy "teachers update own lessons"
    on public.lessons for update to authenticated
    using (exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid()))
    with check (exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid()));
  end if;
end $$;
