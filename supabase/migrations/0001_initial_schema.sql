create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'teacher', 'course_author', 'admin');
create type public.teacher_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.lesson_status as enum ('scheduled', 'live', 'completed', 'cancelled');
create type public.content_status as enum ('draft', 'pending_review', 'published', 'archived');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  bio text,
  timezone text not null default 'UTC',
  locale text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique,
  headline text not null,
  description text,
  hourly_rate numeric(10, 2) not null,
  currency text not null default 'RUB',
  experience_years int not null default 0,
  intro_video_url text,
  status public.teacher_status not null default 'draft',
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.teacher_subjects (
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

create table public.teacher_documents (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  storage_path text not null,
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.teacher_availability_rules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null,
  is_active boolean not null default true,
  check (start_time < end_time)
);

create table public.teacher_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  type text not null check (type in ('available', 'unavailable')),
  check ((start_time is null and end_time is null) or (start_time < end_time))
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending',
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references public.bookings(id) on delete set null,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.lesson_status not null default 'scheduled',
  video_provider text default 'daily',
  video_room_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.lesson_participants (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('student', 'teacher', 'observer')),
  joined_at timestamptz,
  left_at timestamptz,
  unique (lesson_id, user_id)
);

create table public.whiteboard_rooms (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.whiteboard_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.whiteboard_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event jsonb not null,
  created_at timestamptz not null default now()
);

create table public.lesson_messages (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_path text,
  created_at timestamptz not null default now(),
  check (body is not null or attachment_path is not null)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text,
  cover_path text,
  price numeric(10, 2) not null default 0,
  currency text not null default 'RUB',
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position int not null,
  unique (course_id, position)
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.course_chapters(id) on delete cascade,
  title text not null,
  description text,
  video_path text,
  pdf_path text,
  homework text,
  position int not null,
  duration_seconds int,
  unique (chapter_id, position)
);

create table public.course_purchases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('paid', 'refunded', 'cancelled')),
  purchased_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  body text,
  status text not null default 'published' check (status in ('published', 'hidden', 'reported')),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('user', 'teacher', 'course', 'lesson', 'review')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now()
);

create index teacher_profiles_status_idx on public.teacher_profiles(status);
create index bookings_student_starts_idx on public.bookings(student_id, starts_at);
create index bookings_teacher_starts_idx on public.bookings(teacher_id, starts_at);
create index lessons_starts_idx on public.lessons(starts_at);
create index lesson_messages_lesson_created_idx on public.lesson_messages(lesson_id, created_at);
create index courses_status_idx on public.courses(status);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.teacher_documents enable row level security;
alter table public.teacher_availability_rules enable row level security;
alter table public.teacher_availability_exceptions enable row level security;
alter table public.bookings enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_participants enable row level security;
alter table public.whiteboard_rooms enable row level security;
alter table public.whiteboard_events enable row level security;
alter table public.lesson_messages enable row level security;
alter table public.courses enable row level security;
alter table public.course_chapters enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_purchases enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

create or replace function public.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create policy "profiles are readable by authenticated users"
on public.profiles for select to authenticated using (true);

create policy "users update own profile"
on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "public approved teachers"
on public.teacher_profiles for select to anon, authenticated using (status = 'approved' or user_id = auth.uid() or public.has_role('admin'));

create policy "teachers manage own profile"
on public.teacher_profiles for all to authenticated using (user_id = auth.uid() or public.has_role('admin')) with check (user_id = auth.uid() or public.has_role('admin'));

create policy "subjects readable"
on public.subjects for select to anon, authenticated using (true);

create policy "teacher subjects readable"
on public.teacher_subjects for select to anon, authenticated using (true);

create policy "bookings visible to parties"
on public.bookings for select to authenticated using (
  student_id = auth.uid()
  or exists (select 1 from public.teacher_profiles tp where tp.id = teacher_id and tp.user_id = auth.uid())
  or public.has_role('admin')
);

create policy "students create own bookings"
on public.bookings for insert to authenticated with check (student_id = auth.uid());

create policy "lessons visible to participants"
on public.lessons for select to authenticated using (
  public.has_role('admin')
  or exists (select 1 from public.lesson_participants lp where lp.lesson_id = id and lp.user_id = auth.uid())
);

create policy "lesson participants visible to same lesson"
on public.lesson_participants for select to authenticated using (
  public.has_role('admin')
  or exists (
    select 1 from public.lesson_participants mine
    where mine.lesson_id = lesson_id and mine.user_id = auth.uid()
  )
);

create policy "lesson messages visible to participants"
on public.lesson_messages for select to authenticated using (
  exists (select 1 from public.lesson_participants lp where lp.lesson_id = lesson_id and lp.user_id = auth.uid())
  or public.has_role('admin')
);

create policy "participants send lesson messages"
on public.lesson_messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (select 1 from public.lesson_participants lp where lp.lesson_id = lesson_id and lp.user_id = auth.uid())
);

create policy "published courses are public"
on public.courses for select to anon, authenticated using (status = 'published' or author_id = auth.uid() or public.has_role('admin'));

create policy "authors manage courses"
on public.courses for all to authenticated using (author_id = auth.uid() or public.has_role('admin')) with check (author_id = auth.uid() or public.has_role('admin'));

create policy "own purchases visible"
on public.course_purchases for select to authenticated using (student_id = auth.uid() or public.has_role('admin'));

create policy "published reviews visible"
on public.reviews for select to anon, authenticated using (status = 'published' or author_id = auth.uid() or public.has_role('admin'));

create policy "users create reports"
on public.reports for insert to authenticated with check (reporter_id = auth.uid());

create policy "admins read reports"
on public.reports for select to authenticated using (public.has_role('admin'));
