alter table public.teacher_students
drop constraint if exists teacher_students_status_check;

alter table public.teacher_students
add constraint teacher_students_status_check
check (status in ('pending', 'active', 'rejected', 'archived'));

drop policy if exists "students answer teacher invitations" on public.teacher_students;
create policy "students answer teacher invitations"
on public.teacher_students for update to authenticated
using (student_id = auth.uid() and status = 'pending')
with check (student_id = auth.uid() and status in ('active', 'rejected'));
