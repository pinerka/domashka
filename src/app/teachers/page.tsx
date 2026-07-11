import Link from "next/link";
import { CheckCircle2, Search, Star } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TeacherRow = {
  id: string;
  slug: string;
  headline: string;
  description: string | null;
  hourly_rate: number | string;
  experience_years: number;
  rating_avg: number | string;
  rating_count: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    user_roles: { role: string }[];
  } | {
    full_name: string;
    avatar_url: string | null;
    user_roles: { role: string }[];
  }[] | null;
  teacher_subjects: {
    subjects: {
      name: string;
    } | null;
  }[];
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

async function getTeachers() {
  if (!isSupabaseConfigured()) {
    return { teachers: [], myTeacherIds: new Set<string>() };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("teacher_profiles")
    .select(
      `
        id,
        slug,
        headline,
        description,
        hourly_rate,
        experience_years,
        rating_avg,
        rating_count,
        profiles:profiles!teacher_profiles_user_id_fkey!inner(
          full_name,
          avatar_url,
          user_roles!inner(role)
        ),
        teacher_subjects(subjects(name))
      `
    )
    .eq("profiles.user_roles.role", "teacher")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const myTeacherIds = new Set<string>();

  if (user) {
    const { data: links } = await supabase
      .from("teacher_students")
      .select("teacher_id")
      .eq("student_id", user.id)
      .eq("status", "active");
    (links ?? []).forEach((link) => myTeacherIds.add(link.teacher_id));
  }

  return { teachers: (data ?? []) as unknown as TeacherRow[], myTeacherIds };
}

export default async function TeachersPage() {
  const { teachers, myTeacherIds } = await getTeachers();
  const myTeachers = teachers.filter((teacher) => myTeacherIds.has(teacher.id));

  return (
    <AppShell>
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1280px] px-6 py-12">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-normal text-[#121424]">Преподаватели</h1>
            <p className="mt-3 text-xl leading-7 text-slate-500">Найдите преподавателя и откройте его профиль.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input className="h-12 rounded-full border-[#deddf1] bg-white pl-12" placeholder="Имя или предмет" />
          </div>
        </header>

        {myTeachers.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-2xl font-black text-[#131525]">Мои преподаватели</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {myTeachers.map((teacher) => {
                const profile = firstRelation(teacher.profiles);
                return (
                  <Card key={`my-${teacher.id}`} className="rounded-[1.35rem] border-[#dcd8ff] shadow-[0_6px_20px_rgba(103,92,255,0.10)]">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4"><Avatar className="h-16 w-16">{profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.full_name} /> : null}<AvatarFallback>{(profile?.full_name ?? "П").slice(0, 2)}</AvatarFallback></Avatar><div><h3 className="text-lg font-black text-[#131525]">{profile?.full_name ?? "Преподаватель"}</h3><Badge className="mt-2 border-[#deddf1] bg-[#fbfbff]">Мой преподаватель</Badge></div></div>
                      <p className="mt-5 font-semibold text-[#131525]">{teacher.headline}</p>
                      <Button asChild className="mt-5 w-full rounded-full bg-[#675cff] hover:bg-[#5b50f0]"><Link href={`/teachers/${teacher.slug}`}>Открыть профиль</Link></Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}

        <h2 className="mt-12 text-2xl font-black text-[#131525]">Преподаватели</h2>
        {teachers.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {teachers.map((teacher) => {
              const profile = firstRelation(teacher.profiles);

              return (
                <Card key={teacher.id} className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.full_name} /> : null}
                          <AvatarFallback>{(profile?.full_name ?? "П").slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-[#131525]">{profile?.full_name ?? "Преподаватель"}</h2>
                            <CheckCircle2 className="h-4 w-4 text-[#675cff]" />
                          </div>
                          <p className="text-sm text-slate-500">{teacher.experience_years} лет опыта</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-bold">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {Number(teacher.rating_avg) > 0 ? Number(teacher.rating_avg).toFixed(1) : "новый"}
                      </span>
                    </div>
                    <p className="mt-5 font-semibold text-[#131525]">{teacher.headline}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{teacher.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {teacher.teacher_subjects.map(({ subjects }) => subjects?.name).filter(Boolean).map((subject) => (
                        <Badge key={subject} className="border-[#deddf1] bg-[#fbfbff]">{subject}</Badge>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-[#ececf4] pt-5">
                      <p className="font-black">
                        {Number(teacher.hourly_rate) > 0 ? `${Number(teacher.hourly_rate).toLocaleString("ru-RU")} ₽ / час` : "Цена не указана"}
                      </p>
                      <Button asChild className="rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
                        <Link href={`/teachers/${teacher.slug}`}>Профиль</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.35rem] border border-[#e3e4ef] bg-white p-8 text-center shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
            <p className="text-lg font-black text-[#131525]">Преподавателей пока нет</p>
            <p className="mt-2 text-slate-500">Когда пользователь выберет роль преподавателя, он появится здесь.</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
