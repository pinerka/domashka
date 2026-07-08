import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText, Play, Star } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBookingAction } from "@/features/bookings/actions";
import { teachers } from "@/lib/mock-data";

export default async function TeacherProfilePage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  const teacher = teachers.find((item) => item.id === teacherId) ?? teachers[0];
  const slots = ["Сегодня 19:00", "Завтра 17:30", "Пт 12:00", "Пт 18:30", "Сб 11:00", "Сб 16:00"];

  return (
    <AppShell>
      <main className="container py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-lg border bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback>{teacher.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-normal">{teacher.name}</h1>
                  <Badge className="gap-1 text-blue-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
                <p className="mt-2 text-lg text-slate-700">{teacher.headline}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {teacher.rating} · {teacher.reviews} отзывов
                  </span>
                  <span>{teacher.experience} опыта</span>
                  <span>{teacher.price.toLocaleString("ru-RU")} ₽ / час</span>
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_220px]">
              <div>
                <h2 className="text-xl font-semibold">О преподавателе</h2>
                <p className="mt-3 leading-7 text-slate-600">{teacher.bio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <Badge key={subject}>{subject}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="flex h-32 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Play className="h-8 w-8" />
                </div>
                <p className="mt-3 text-sm text-slate-600">Видео-визитка и методика обучения.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {["CELTA Certificate", "IELTS Academic 8.5", "Student outcomes report"].map((doc) => (
                <div key={doc} className="flex items-center gap-3 rounded-lg border bg-white p-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">{doc}</span>
                </div>
              ))}
            </div>
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
                <input type="hidden" name="starts_at" value="2026-07-07T16:00:00.000Z" />
                <input type="hidden" name="ends_at" value="2026-07-07T17:00:00.000Z" />
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => (
                    <Button key={slot} type="button" variant="outline" className="justify-start">
                      {slot}
                    </Button>
                  ))}
                </div>
                <Button className="mt-4 w-full" size="lg">
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
