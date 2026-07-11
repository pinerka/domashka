do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'authenticated users read directory roles'
  ) then
    create policy "authenticated users read directory roles"
    on public.user_roles for select to authenticated
    using (role in ('student', 'teacher') or public.has_role('admin'));
  end if;
end $$;
