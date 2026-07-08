insert into public.subjects (name, slug)
values
  ('Английский', 'english'),
  ('IELTS', 'ielts'),
  ('Математика', 'math'),
  ('Физика', 'physics'),
  ('Product Design', 'product-design'),
  ('Программирование', 'programming')
on conflict (slug) do nothing;

-- Demo identity rows for local Supabase. In a hosted project, create users via
-- Supabase Auth first, then keep the same profile/user_roles shape.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000101', 'student@learnspace.dev', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Никита Орлов","role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000201', 'teacher@learnspace.dev', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Анна Морозова","role":"teacher"}', now(), now()),
  ('00000000-0000-0000-0000-000000000301', 'author@learnspace.dev', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Мария Ли","role":"course_author"}', now(), now()),
  ('00000000-0000-0000-0000-000000000401', 'admin@learnspace.dev', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Admin User","role":"admin"}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, full_name, timezone, locale, bio)
values
  ('00000000-0000-0000-0000-000000000101', 'Никита Орлов', 'Europe/Moscow', 'ru', 'Student demo account'),
  ('00000000-0000-0000-0000-000000000201', 'Анна Морозова', 'Europe/Moscow', 'ru', 'IELTS and career English teacher'),
  ('00000000-0000-0000-0000-000000000301', 'Мария Ли', 'Europe/Moscow', 'ru', 'Course author and product design mentor'),
  ('00000000-0000-0000-0000-000000000401', 'Admin User', 'Europe/Moscow', 'ru', 'Platform operator')
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
values
  ('00000000-0000-0000-0000-000000000101', 'student'),
  ('00000000-0000-0000-0000-000000000201', 'teacher'),
  ('00000000-0000-0000-0000-000000000301', 'course_author'),
  ('00000000-0000-0000-0000-000000000401', 'admin')
on conflict (user_id, role) do nothing;

insert into public.teacher_profiles (
  id,
  user_id,
  slug,
  headline,
  description,
  hourly_rate,
  currency,
  experience_years,
  status,
  rating_avg,
  rating_count
)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000201',
  'anna-morozova',
  'IELTS и разговорный английский для карьеры',
  'Помогаю взрослым студентам уверенно проходить интервью, выступать на митингах и сдавать IELTS.',
  3200,
  'RUB',
  9,
  'approved',
  4.96,
  184
)
on conflict (id) do nothing;

insert into public.teacher_subjects (teacher_id, subject_id)
select '10000000-0000-0000-0000-000000000001', id
from public.subjects
where slug in ('english', 'ielts')
on conflict do nothing;

insert into public.teacher_availability_rules (teacher_id, weekday, start_time, end_time, timezone)
values
  ('10000000-0000-0000-0000-000000000001', 1, '17:00', '21:00', 'Europe/Moscow'),
  ('10000000-0000-0000-0000-000000000001', 3, '17:00', '21:00', 'Europe/Moscow'),
  ('10000000-0000-0000-0000-000000000001', 6, '10:00', '15:00', 'Europe/Moscow');

insert into public.bookings (id, student_id, teacher_id, starts_at, ends_at, status)
values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000001',
  '2026-07-07 16:00:00+00',
  '2026-07-07 17:00:00+00',
  'confirmed'
)
on conflict (id) do nothing;

insert into public.courses (id, author_id, title, slug, description, cover_path, price, currency, status)
values (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000301',
  'Product Design Career Sprint',
  'product-design-career-sprint',
  'Курс по переходу в продуктовый дизайн с портфолио и интервью.',
  'course-assets/product-design-career-sprint.jpg',
  12900,
  'RUB',
  'published'
)
on conflict (id) do nothing;
