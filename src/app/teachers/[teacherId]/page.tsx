import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText, Play, Star } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBookingAction } from "@/features/bookings/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TeacherProfile = {
  id: string;
  slug: string;
  headline: string;
  description: string | null;
  hourly_rate: number | string;
  experience_years: number;
  intro_video_url: string | null;
  rating_avg: number | string;
  rating_count: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | {
    full_name: string;
    avatar_url: string | null;
  }[] | null;
  teacher_subjects: {
    subjects: {
      name: string;
    } | null;
  }[];
  teacher_documents: {
    title: string;
  }[];
  teacher_availability_rules: {
    weekday: number;
    start_time: string;
    end_time: string;
  }[];
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

async function getTeacherProfile(slug: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const selectTeacherProfile = `
    id,
    slug,
    headline,
    description,
    hourly_rate,
    experience_years,
    intro_video_url,
    rating_avg,
    rating_count,
    profiles:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url),
    teacher_subjects(subjects(name)),
    teacher_documents(title),
    teacher_availability_rules(weekday, start_time, end_time)
  `;

  const { data, error } = await supabase
    .from("teacher_profiles")
    .select(selectTeacherProfile)
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    return null;
  }

  if (!data) {
    const { data: fallbackData } = await supabase
      .from("teacher_profiles")
      .select(selectTeacherProfile)
      .ilike("slug", `${slug}-%`)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return fallbackData as unknown as TeacherProfile | null;
  }

  return data as unknown as TeacherProfile | null;
}

function toNextSlot(rule: TeacherProfile["teacher_availability_rules"][number]) {
  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const startsAt = new Date();
  const daysUntilSlot = (rule.weekday - startsAt.getDay() + 7) % 7;
  startsAt.setDate(startsAt.getDate() + daysUntilSlot);

  const [startHours, startMinutes] = rule.start_time.split(":").map(Number);
  startsAt.setHours(startHours, startMinutes, 0, 0);

  if (startsAt.getTime() <= Date.now()) {
    startsAt.setDate(startsAt.getDate() + 7);
  }

  const endsAt = new Date(startsAt);
  const [endHours, endMinutes] = rule.end_time.split(":").map(Number);
  endsAt.setHours(endHours, endMinutes, 0, 0);

  return {
    label: `${weekdays[rule.weekday] ?? ""} ${rule.start_time.slice(0, 5)}`.trim(),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

export default async function TeacherProfilePage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  const teacher = await getTeacherProfile(teacherId);
  const slots = teacher?.teacher_availability_rules.map(toNextSlot) ?? [];
  const subjects = teacher?.teacher_subjects.map(({ subjects }) => subjects?.name).filter(Boolean) ?? [];
  const profile = firstRelation(teacher?.profiles ?? null);

  if (!teacher) {
    return (
      <AppShell>
        <main className="container py-10">
          <section className="rounded-lg border bg-white p-8 text-center shadow-soft">
            <h1 className="text-2xl font-semibold tracking-normal">Преподаватель не найден</h1>
            <p className="mt-2 text-slate-600">Возможно, профиль еще не заполнен или ссылка изменилась.</p>
            <Button asChild className="mt-5">
              <Link href="/teachers">Вернуться к преподавателям</Link>
            </Button>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="container py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-lg border bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <Avatar className="h-24 w-24">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.full_name} /> : null}
                <AvatarFallback>{(profile?.full_name ?? "П").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-normal">{profile?.full_name ?? "Преподаватель"}</h1>
                  <Badge className="gap-1 text-blue-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
                <p className="mt-2 text-lg text-slate-700">{teacher.headline}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {Number(teacher.rating_avg) > 0 ? Number(teacher.rating_avg).toFixed(1) : "новый"} · {teacher.rating_count} отзывов
                  </span>
                  <span>{teacher.experience_years} лет опыта</span>
                  <span>{Number(teacher.hourly_rate) > 0 ? `${Number(teacher.hourly_rate).toLocaleString("ru-RU")} ₽ / час` : "Цена не указана"}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_220px]">
              <div>
                <h2 className="text-xl font-semibold">О преподавателе</h2>
                <p className="mt-3 leading-7 text-slate-600">{teacher.description || "Описание пока не заполнено."}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <Badge key={subject}>{subject}</Badge>
                  ))}
                </div>
              </div>
              {teacher.intro_video_url ? (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex h-32 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Play className="h-8 w-8" />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Видео-визитка и методика обучения.</p>
                </div>
              ) : null}
            </div>
            {teacher.teacher_documents.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {teacher.teacher_documents.map((doc) => (
                  <div key={doc.title} className="flex items-center gap-3 rounded-lg border bg-white p-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{doc.title}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <Card className="h-fit shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Свободные слоты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createBookingAction}>
                <input type="hidden" name="teacher_id" value={teacher.id} />
                <input type="hidden" name="starts_at" value={slots[0]?.startsAt ?? ""} />
                <input type="hidden" name="ends_at" value={slots[0]?.endsAt ?? ""} />
                <div className="grid grid-cols-2 gap-2">
                  {slots.length > 0 ? slots.map((slot) => (
                    <Button key={slot.startsAt} type="button" variant="outline" className="justify-start">
                      {slot.label}
                    </Button>
                  )) : (
                    <p className="col-span-2 text-sm text-slate-500">Свободные слоты пока не добавлены.</p>
                  )}
                </div>
                <Button className="mt-4 w-full" size="lg" disabled={slots.length === 0}>
                  Забронировать урок
                </Button>
              </form>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Создается booking со статусом pending. После подтверждения преподавателем база создаст lesson room.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
