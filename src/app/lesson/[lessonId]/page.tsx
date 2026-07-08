import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, NotebookText, Trash2, UserRound, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteLessonAction } from "@/features/lessons/actions";
import { encodeLessonParams, type PlannedLesson } from "@/features/lessons/types";

export default async function LessonPage({
  params,
  searchParams
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<Partial<PlannedLesson>>;
}) {
  const { lessonId } = await params;
  const query = await searchParams;
  const lesson: PlannedLesson = {
    id: lessonId,
    title: query.title ?? "Урок",
    startsAt: query.startsAt ?? new Date().toISOString(),
    endsAt: query.endsAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    roomUrl: query.roomUrl ?? "",
    teacherName: query.teacherName ?? "Pinerov Volodya",
    studentName: query.studentName ?? "Владимир"
  };

  const displayDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(lesson.startsAt));

  return (
    <main className="min-h-screen bg-[#f8f8ff] px-6 py-10">
      <Button asChild variant="outline" className="fixed left-6 top-6 z-50 h-11 rounded-full border-[#deddf1] bg-white/95 px-5 font-bold shadow-sm backdrop-blur">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
      </Button>
      <div className="mx-auto max-w-[1120px]">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80')] bg-cover" />
            <div>
              <p className="text-lg font-black text-[#121424]">{lesson.teacherName}</p>
              <p className="text-slate-500">Репетитор</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#deddf1] bg-[#f0efff] text-slate-600">
              <UserRound className="h-8 w-8" />
            </span>
            <div>
              <p className="text-lg font-black text-[#121424]">{lesson.studentName}</p>
              <p className="text-slate-500">Ученик</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <span className="rounded-full bg-[#efedff] px-4 py-2 text-sm font-bold text-[#675cff]">Запланирован</span>
          <h1 className="mt-5 text-5xl font-black tracking-normal text-[#080b1c]">{lesson.title}</h1>
          <p className="mt-3 text-xl text-slate-500">{lesson.title} · {displayDate} · 60 мин</p>
        </div>

        <Card className="mt-8 rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
          <CardContent className="flex min-h-56 flex-col items-center justify-center p-10 text-center">
            <Video className="h-10 w-10 text-[#675cff]" />
            <h2 className="mt-5 text-2xl font-black text-[#121424]">Готовы начать урок?</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              Видеозвонок откроется прямо на этой странице. Ссылка приглашения будет доступна внутри комнаты урока.
            </p>
            <Button asChild className="mt-6 h-12 rounded-full bg-[#675cff] px-8 hover:bg-[#5b50f0]">
              <Link href={`/lesson/${lessonId}/room?${encodeLessonParams(lesson)}`}>
                <Video className="h-4 w-4" />
                Присоединиться
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6">
          <Card className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black text-[#121424]">
                  <BookOpen className="h-5 w-5 text-[#675cff]" />
                  План урока
                </h3>
                <p className="mt-3 text-slate-500">Что планируете разобрать на уроке?</p>
              </div>
              <Button variant="ghost">Изменить</Button>
            </CardContent>
          </Card>

          <Card className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black text-[#121424]">
                  <NotebookText className="h-5 w-5 text-[#675cff]" />
                  Заметки
                </h3>
                <p className="mt-3 text-slate-500">Как прошёл урок, что задать на дом...</p>
              </div>
              <Button variant="ghost">Изменить</Button>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            Урок сохранен в разделе “Предстоящие”.
          </div>

          <form action={deleteLessonAction} className="flex justify-center pt-2">
            <input type="hidden" name="lesson_id" value={lessonId} />
            <Button variant="ghost" className="rounded-full text-red-500 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
              Удалить урок
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
