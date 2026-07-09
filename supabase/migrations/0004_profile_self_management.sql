do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'users insert own profile'
  ) then
    create policy "users insert own profile"
    on public.profiles for insert to authenticated
    with check (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'users read own roles'
  ) then
    create policy "users read own roles"
    on public.user_roles for select to authenticated
    using (user_id = auth.uid() or public.has_role('admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'users insert own basic role'
  ) then
    create policy "users insert own basic role"
    on public.user_roles for insert to authenticated
    with check (user_id = auth.uid() and role in ('student', 'teacher'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'users delete own basic role'
  ) then
    create policy "users delete own basic role"
    on public.user_roles for delete to authenticated
    using (user_id = auth.uid() and role in ('student', 'teacher'));
  end if;
end $$;
