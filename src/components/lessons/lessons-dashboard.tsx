import Link from "next/link";
import { CalendarDays, Check, Clock3, Plus, UserPlus, Video, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { encodeLessonParams, type PlannedLesson } from "@/features/lessons/types";
import { answerTeacherInvitationAction } from "@/features/teacher-students/actions";
import type { TeacherInvitation } from "@/features/teacher-students/queries";

function EmptyLessonSection({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-black tracking-normal text-[#131525]">{title}</h2>
      <div className="mt-5 rounded-[1.35rem] border border-[#e3e4ef] bg-white px-6 py-8 shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0efff] text-[#675cff]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-[#1b1d2d]">{description}</p>
            <p className="mt-1 text-sm text-slate-500">Уроки появятся здесь после планирования или завершения.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LessonsDashboard({
  plannedLessons = [],
  canCreateLesson = false,
  teacherInvitations = []
}: {
  plannedLessons?: PlannedLesson[];
  canCreateLesson?: boolean;
  teacherInvitations?: TeacherInvitation[];
}) {
  const upcomingLessons = plannedLessons.filter((lesson) => lesson.status !== "completed");
  const completedLessons = plannedLessons.filter((lesson) => lesson.status === "completed");

  return (
    <main className="min-h-[calc(100vh-5rem)] border-t border-[#ececf4] bg-[#f8f8ff]">
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-14">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-normal text-[#121424]">Мои уроки</h1>
            <p className="mt-3 text-xl leading-7 text-slate-500">Присоединяйтесь к урокам и пересматривайте записи.</p>
          </div>
          {canCreateLesson ? (
            <Button asChild className="w-fit rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
              <Link href="/lessons/new">
                <Plus className="h-4 w-4" />
                Создать урок
              </Link>
            </Button>
          ) : null}
        </header>

        {teacherInvitations.length > 0 ? (
          <section className="mt-8 space-y-3">
            {teacherInvitations.map((invitation) => (
              <div key={invitation.id} className="ml-auto flex max-w-xl flex-col gap-4 rounded-[1.35rem] border border-[#dcd8ff] bg-white p-5 shadow-[0_8px_28px_rgba(103,92,255,0.12)] sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#efedff] text-[#675cff]">
                  <UserPlus className="h-5 w-5" />
                </span>
                <p className="flex-1 font-semibold text-[#1b1d2d]">
                  Преподаватель <span className="font-black">{invitation.teacherName}</span> приглашает вас в ученики.
                </p>
                <div className="flex gap-2">
                  <form action={answerTeacherInvitationAction}>
                    <input type="hidden" name="invitation_id" value={invitation.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <Button className="rounded-full bg-[#675cff] hover:bg-[#5b50f0]"><Check className="h-4 w-4" />Принять</Button>
                  </form>
                  <form action={answerTeacherInvitationAction}>
                    <input type="hidden" name="invitation_id" value={invitation.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <Button variant="outline" className="rounded-full"><X className="h-4 w-4" />Отклонить</Button>
                  </form>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="text-2xl font-black tracking-normal text-[#131525]">Предстоящие</h2>
          {upcomingLessons.length > 0 ? (
            <div className="mt-5 space-y-4">
              {upcomingLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.id}?${encodeLessonParams(lesson)}`}
                  className="block rounded-[1.35rem] border border-[#e3e4ef] bg-white px-6 py-6 shadow-[0_3px_10px_rgba(17,24,39,0.06)] transition hover:border-[#675cff]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-[#efedff] px-3 py-1 text-sm font-bold text-[#675cff]">Запланирован</span>
                      <h3 className="mt-4 text-xl font-black text-[#121424]">{lesson.title}</h3>
                      <p className="mt-2 text-base text-slate-500">
                        Репетитор: {lesson.teacherName} ·{" "}
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        }).format(new Date(lesson.startsAt))}{" "}
                        · 60 мин
                      </p>
                    </div>
                    <Video className="h-6 w-6 text-slate-500" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.35rem] border border-[#e3e4ef] bg-white px-6 py-8 shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
              <div className="flex items-center gap-4 text-slate-500">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0efff] text-[#675cff]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-[#1b1d2d]">Запланированные уроки</p>
                  <p className="mt-1 text-sm text-slate-500">Уроки появятся здесь после планирования.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black tracking-normal text-[#131525]">Завершённые уроки</h2>
          {completedLessons.length > 0 ? (
            <div className="mt-5 space-y-4">
              {completedLessons.map((lesson) => (
                <Link key={lesson.id} href={`/lesson/${lesson.id}?${encodeLessonParams(lesson)}`} className="block rounded-[1.35rem] border border-[#e3e4ef] bg-white px-6 py-6 shadow-[0_3px_10px_rgba(17,24,39,0.06)] transition hover:border-[#675cff]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">Завершён</span>
                      <h3 className="mt-4 text-xl font-black text-[#121424]">{lesson.title}</h3>
                      <p className="mt-2 text-base text-slate-500">Репетитор: {lesson.teacherName} · {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(lesson.startsAt))}</p>
                    </div>
                    <Clock3 className="h-6 w-6 text-emerald-600" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.35rem] border border-[#e3e4ef] bg-white px-6 py-8 text-slate-500 shadow-[0_3px_10px_rgba(17,24,39,0.06)]">Завершённых уроков пока нет.</div>
          )}
        </section>
      </div>
    </main>
  );
}
