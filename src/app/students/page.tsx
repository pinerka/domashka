import { Search, UserPlus, UserRound } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addStudentToTeacherAction } from "@/features/teacher-students/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StudentRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  created_at: string;
};

async function getStudentsData() {
  if (!isSupabaseConfigured()) {
    return {
      students: [],
      teacherProfileId: null,
      linkedStudentIds: new Set<string>(),
      pendingStudentIds: new Set<string>()
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: students } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        avatar_url,
        bio,
        timezone,
        created_at,
        user_roles!inner(role)
      `
    )
    .eq("user_roles.role", "student")
    .order("created_at", { ascending: false });

  let teacherProfileId: string | null = null;
  const linkedStudentIds = new Set<string>();
  const pendingStudentIds = new Set<string>();

  if (user) {
    const { data: teacherProfile } = await supabase.from("teacher_profiles").select("id").eq("user_id", user.id).maybeSingle();
    teacherProfileId = teacherProfile?.id ?? null;

    if (teacherProfileId) {
      const { data: links } = await supabase.from("teacher_students").select("student_id, status").eq("teacher_id", teacherProfileId).in("status", ["active", "pending"]);
      (links ?? []).forEach((link) => (link.status === "active" ? linkedStudentIds : pendingStudentIds).add(link.student_id));
    }
  }

  return {
    students: (students ?? []) as unknown as StudentRow[],
    teacherProfileId,
    linkedStudentIds,
    pendingStudentIds
  };
}

function StudentCards({ students, teacherProfileId, linkedStudentIds, pendingStudentIds }: {
  students: StudentRow[];
  teacherProfileId: string | null;
  linkedStudentIds: Set<string>;
  pendingStudentIds: Set<string>;
}) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      {students.map((student) => (
        <Card key={student.id} className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">{student.avatar_url ? <AvatarImage src={student.avatar_url} alt={student.full_name} /> : null}<AvatarFallback>{student.full_name.slice(0, 2)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-black text-[#131525]">{student.full_name}</h2><Badge className="border-[#deddf1] bg-[#fbfbff]">Ученик</Badge></div><p className="mt-1 text-sm text-slate-500">{student.timezone}</p></div>
            </div>
            {student.bio ? <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500">{student.bio}</p> : null}
            <div className="mt-6 flex flex-col gap-3 border-t border-[#ececf4] pt-5">
              <p className="text-sm font-semibold text-slate-500">Зарегистрирован: {new Date(student.created_at).toLocaleDateString("ru-RU")}</p>
              {teacherProfileId ? linkedStudentIds.has(student.id) ? (
                <Badge className="w-fit border-[#deddf1] bg-[#fbfbff]">В моих учениках</Badge>
              ) : pendingStudentIds.has(student.id) ? (
                <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-700">Приглашение отправлено</Badge>
              ) : (
                <form action={addStudentToTeacherAction}><input type="hidden" name="student_id" value={student.id} /><Button className="w-full rounded-full bg-[#675cff] hover:bg-[#5b50f0]"><UserPlus className="h-4 w-4" />Пригласить в мои ученики</Button></form>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function StudentsPage() {
  const { students, teacherProfileId, linkedStudentIds, pendingStudentIds } = await getStudentsData();
  const myStudents = students.filter((student) => linkedStudentIds.has(student.id));
  const otherStudents = students.filter((student) => !linkedStudentIds.has(student.id));

  return (
    <AppShell>
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1280px] px-6 py-12">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-normal text-[#121424]">Ученики</h1>
            <p className="mt-3 text-xl leading-7 text-slate-500">Здесь появляются зарегистрированные ученики платформы.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input className="h-12 rounded-full border-[#deddf1] bg-white pl-12" placeholder="Имя ученика" />
          </div>
        </header>

        {students.length > 0 ? (
          <div className="mt-10 space-y-12">
            {teacherProfileId ? <section><h2 className="text-2xl font-black text-[#131525]">Мои ученики</h2>{myStudents.length ? <StudentCards students={myStudents} teacherProfileId={teacherProfileId} linkedStudentIds={linkedStudentIds} pendingStudentIds={pendingStudentIds} /> : <p className="mt-4 text-slate-500">Принятых учеников пока нет.</p>}</section> : null}
            <section><h2 className="text-2xl font-black text-[#131525]">Ученики</h2><StudentCards students={otherStudents} teacherProfileId={teacherProfileId} linkedStudentIds={linkedStudentIds} pendingStudentIds={pendingStudentIds} /></section>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.35rem] border border-[#e3e4ef] bg-white p-8 text-center shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#efedff] text-[#675cff]">
              <UserRound className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-black text-[#131525]">Учеников пока нет</p>
            <p className="mt-2 text-slate-500">Когда пользователь зарегистрируется как ученик, он появится здесь.</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
