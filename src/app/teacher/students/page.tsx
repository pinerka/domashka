import Link from "next/link";
import { CalendarDays, Search, Send, UserRound } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { InvitationNotice } from "@/components/teacher-students/invitation-notice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inviteStudentToLessonAction } from "@/features/teacher-students/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TeacherStudentRow = {
  id: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    timezone: string;
  } | {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    timezone: string;
  }[] | null;
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

async function getMyStudents() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: teacherProfile } = await supabase.from("teacher_profiles").select("id").eq("user_id", user.id).maybeSingle();

  if (!teacherProfile) {
    return [];
  }

  const { data } = await supabase
    .from("teacher_students")
    .select(
      `
        id,
        created_at,
        profiles:profiles!teacher_students_student_id_fkey(id, full_name, avatar_url, bio, timezone)
      `
    )
    .eq("teacher_id", teacherProfile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as TeacherStudentRow[];
}

export default async function TeacherStudentsPage({
  searchParams
}: {
  searchParams: Promise<{ invited?: string; error?: string }>;
}) {
  const query = await searchParams;
  const links = await getMyStudents();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <InvitationNotice
        message={
          query.invited === "1"
            ? "Урок появился в разделе «Запланированные уроки» у вас и у ученика. В него уже можно перейти с главной страницы."
            : undefined
        }
      />
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1280px] px-6 py-12">
        {query.error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-700">
            Не удалось отправить приглашение: {query.error}
          </div>
        ) : null}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge>Teacher CRM</Badge>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-[#121424]">Мои ученики</h1>
            <p className="mt-3 text-xl leading-7 text-slate-500">Добавляйте учеников и приглашайте их на закрытые уроки.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/students">
                <Search className="h-4 w-4" />
                Найти ученика
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
              <Link href="/teacher/bookings">
                <CalendarDays className="h-4 w-4" />
                Бронирования
              </Link>
            </Button>
          </div>
        </header>

        {links.length > 0 ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {links.map((link) => {
              const student = firstRelation(link.profiles);

              if (!student) {
                return null;
              }

              return (
                <Card key={link.id} className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {student.avatar_url ? <AvatarImage src={student.avatar_url} alt={student.full_name} /> : null}
                        <AvatarFallback>{student.full_name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-xl font-black text-[#131525]">{student.full_name}</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">{student.timezone}</p>
                      </div>
                      <Badge className="border-[#deddf1] bg-[#fbfbff]">Ученик</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {student.bio ? <p className="line-clamp-2 text-sm leading-6 text-slate-500">{student.bio}</p> : null}
                    <form action={inviteStudentToLessonAction} className="mt-5 grid gap-3 border-t border-[#ececf4] pt-5">
                      <input type="hidden" name="student_id" value={student.id} />
                      <Input name="title" required placeholder="Тема урока" className="h-11 rounded-xl border-[#dfe1ee]" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input name="date" type="date" min={today} defaultValue={today} required className="h-11 rounded-xl border-[#dfe1ee]" />
                        <Input name="time" type="time" required className="h-11 rounded-xl border-[#dfe1ee]" />
                      </div>
                      <Button className="rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
                        <Send className="h-4 w-4" />
                        Пригласить на урок
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.35rem] border border-[#e3e4ef] bg-white p-8 text-center shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#efedff] text-[#675cff]">
              <UserRound className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-black text-[#131525]">Ученики еще не добавлены</p>
            <p className="mt-2 text-slate-500">Откройте раздел учеников и добавьте нужного ученика в свой список.</p>
            <Button asChild className="mt-5 rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
              <Link href="/students">Перейти к ученикам</Link>
            </Button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
