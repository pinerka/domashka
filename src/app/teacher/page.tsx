import { BarChart3, CalendarDays, CheckCircle2, CreditCard, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <AppShell>
      <main className="container py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge>Teacher CRM</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">Кабинет преподавателя</h1>
            <p className="mt-2 text-slate-600">Профиль, расписание, уроки, ученики, отзывы, доход и статистика.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/teacher/profile">Редактировать профиль</Link>
            </Button>
            <Button asChild>
              <Link href="/teacher/bookings">Бронирования</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Занятий на неделе", "14", CalendarDays],
            ["Активные ученики", "38", Users],
            ["Доход за месяц", "186 400 ₽", CreditCard],
            ["Средний рейтинг", "4.96", BarChart3]
          ].map(([label, value, Icon]) => (
            <Card key={label as string}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-slate-500">{label as string}</p>
                  <p className="mt-1 text-2xl font-semibold">{value as string}</p>
                </div>
                <Icon className="h-5 w-5 text-blue-600" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Описание заполнено", "Документы подтверждены", "Видео-визитка добавлена", "Календарь активен"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Расписание</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {["Пн", "Вт", "Ср", "Чт", "Пт"].map((day) => (
                  <div key={day} className="min-h-56 rounded-lg border bg-slate-50 p-3">
                    <p className="text-sm font-medium">{day}</p>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-md bg-white p-2 text-xs shadow-sm">10:00 Английский</div>
                      <div className="rounded-md bg-white p-2 text-xs shadow-sm">17:30 IELTS</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
