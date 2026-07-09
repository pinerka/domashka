insert into public.subjects (name, slug)
values
  ('Английский', 'english'),
  ('IELTS', 'ielts'),
  ('Математика', 'math'),
  ('Физика', 'physics'),
  ('Product Design', 'product-design'),
  ('Программирование', 'programming')
on conflict (slug) do nothing;
