import { Bell, BookOpen, CalendarDays, ChevronDown, Clock, Grid2X2, Sparkles, Type, User, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLessonAction } from "@/features/lessons/actions";

function CalendarIllustration() {
  return (
    <div className="relative h-48 w-72">
      <div className="absolute left-14 top-4 h-36 w-36 rotate-6 rounded-[1.25rem] bg-white shadow-[0_24px_60px_rgba(103,92,255,0.22)]">
        <div className="h-10 rounded-t-[1.25rem] bg-[#7667ff]" />
        <div className="grid grid-cols-4 gap-2 p-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index} className={`h-5 rounded ${index === 6 ? "bg-[#7667ff]" : "bg-[#eef0fb]"}`} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 right-6 flex h-24 w-24 items-center justify-center rounded-full border-[8px] border-[#dcd8ff] bg-white shadow-[0_18px_45px_rgba(103,92,255,0.22)]">
        <Clock className="h-11 w-11 text-[#675cff]" />
      </div>
      <Sparkles className="absolute left-3 top-14 h-5 w-5 text-[#9b92ff]" />
      <Sparkles className="absolute right-2 top-8 h-4 w-4 text-[#9b92ff]" />
    </div>
  );
}

export default function NewLessonPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f8f8ff] p-3">
      <div className="min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.35rem] border border-[#e4e5f2] bg-gradient-to-br from-white via-[#fbfbff] to-[#f4f0ff] shadow-[0_18px_70px_rgba(17,24,39,0.08)]">
        <header className="flex h-24 items-center justify-between border-b border-[#ececf4] bg-white/88 px-11 backdrop-blur">
          <Link href="/" className="flex items-center gap-3 text-2xl font-black text-[#111426]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#675cff] text-white shadow-[0_10px_24px_rgba(103,92,255,0.25)]">
              <Sparkles className="h-5 w-5" />
            </span>
            LearnSpace
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {[
              ["Уроки", Grid2X2, "/"],
              ["Преподаватели", Users, "/teachers"],
              ["Методичка", BookOpen, "/courses"],
              ["Профиль", User, "/profile"]
            ].map(([label, Icon, href], index) => (
              <Link
                key={label as string}
                href={href as string}
                className={`flex items-center gap-2 rounded-full px-5 py-3 text-base font-bold ${
                  index === 0 ? "bg-[#f0edff] text-[#675cff]" : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label as string}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#675cff] text-lg font-black text-white">N</span>
            <ChevronDown className="h-4 w-4 text-slate-600" />
          </div>
        </header>

        <section className="relative mx-auto grid max-w-[980px] gap-8 px-6 pb-24 pt-24">
          <div className="absolute left-[-160px] top-56 h-[420px] w-[420px] rounded-full border border-dashed border-[#d9d6ff]" />
          <div className="absolute right-[-180px] top-80 h-[460px] w-[460px] rounded-full border border-dashed border-[#d9d6ff]" />

          <div className="relative z-10 grid items-start gap-8 md:grid-cols-[1fr_320px]">
            <div>
              <h1 className="text-5xl font-black tracking-normal text-[#111426]">Создать урок</h1>
              <p className="mt-5 max-w-xl text-xl leading-8 text-slate-500">
                Укажите тему, дату и время.
                <br />
                После создания откроется комната урока.
              </p>
            </div>
            <div className="hidden justify-self-end md:block">
              <CalendarIllustration />
            </div>
          </div>

          <div className="relative z-10 rounded-[1.5rem] border border-[#e6e6f2] bg-white/92 p-10 shadow-[0_24px_80px_rgba(103,92,255,0.12)] backdrop-blur">
            <div className="mb-8 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0edff] text-[#675cff]">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-black text-[#111426]">Данные урока</h2>
            </div>

            <form action={createLessonAction} className="grid gap-8">
              <div className="grid gap-3">
                <label className="flex items-center gap-2 text-base font-black text-[#131525]" htmlFor="title">
                  <Type className="h-5 w-5 text-[#675cff]" />
                  Тема урока
                </label>
                <Input id="title" name="title" required placeholder="Например: Present Simple" className="h-16 rounded-xl border-[#dfe1ee] px-5 text-lg" />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-3">
                  <label className="flex items-center gap-2 text-base font-black text-[#131525]" htmlFor="date">
                    <CalendarDays className="h-5 w-5 text-[#675cff]" />
                    Дата
                  </label>
                  <Input id="date" name="date" type="date" min={today} defaultValue={today} required className="h-16 rounded-xl border-[#dfe1ee] px-5 text-lg" />
                </div>
                <div className="grid gap-3">
                  <label className="flex items-center gap-2 text-base font-black text-[#131525]" htmlFor="time">
                    <Clock className="h-5 w-5 text-[#675cff]" />
                    Время
                  </label>
                  <Input id="time" name="time" type="time" required className="h-16 rounded-xl border-[#dfe1ee] px-5 text-lg" />
                </div>
              </div>

              <div className="flex flex-col gap-5 border-t border-[#ececf4] pt-8 md:flex-row md:items-center">
                <Button className="h-14 rounded-2xl bg-[#675cff] px-8 text-base font-black shadow-[0_14px_30px_rgba(103,92,255,0.28)] hover:bg-[#5b50f0]">
                  <Sparkles className="h-5 w-5" />
                  Создать урок
                </Button>
                <p className="max-w-md text-sm font-semibold leading-6 text-[#7770cc]">
                  После создания урока вы сможете пригласить учеников и начать занятие.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
