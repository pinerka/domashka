import Link from "next/link";
import { CalendarCheck, CircleCheck, Clock, XCircle } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelBookingAction, completeLessonAction, confirmBookingAction } from "@/features/bookings/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  starts_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  profiles: {
    full_name: string;
  } | {
    full_name: string;
  }[] | null;
  lessons: {
    id: string;
    title: string;
  }[];
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

async function getTeacherBookings() {
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
    .from("bookings")
    .select(
      `
        id,
        starts_at,
        status,
        profiles:profiles!bookings_student_id_fkey(full_name),
        lessons(id, title)
      `
    )
    .eq("teacher_id", teacherProfile.id)
    .order("starts_at", { ascending: true });

  return (data ?? []) as unknown as BookingRow[];
}

export default async function TeacherBookingsPage() {
  const bookings = await getTeacherBookings();

  return (
    <AppShell>
      <main className="container py-10">
        <div className="mb-8">
          <Badge>Booking lifecycle</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Бронирования и уроки</h1>
          <p className="mt-2 text-slate-600">Подтверждение заявки создает lesson room, доску и участников урока.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              Очередь занятий
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.length > 0 ? bookings.map((booking) => {
              const lesson = booking.lessons[0];
              const student = firstRelation(booking.profiles);

              return (
              <div key={booking.id} className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{lesson?.title ?? "Занятие"}</p>
                    <Badge>{booking.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {student?.full_name ?? "Ученик"} · {new Date(booking.starts_at).toLocaleString("ru-RU")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {booking.status === "pending" ? (
                    <form action={confirmBookingAction}>
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <Button size="sm">
                        <CircleCheck className="h-4 w-4" />
                        Подтвердить
                      </Button>
                    </form>
                  ) : (
                    <Button asChild size="sm">
                      <Link href={lesson ? `/lesson/${lesson.id}` : "/teacher/bookings"}>
                        <Clock className="h-4 w-4" />
                        Открыть урок
                      </Link>
                    </Button>
                  )}
                  <form action={completeLessonAction}>
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <input type="hidden" name="lesson_id" value={lesson?.id ?? ""} />
                    <Button variant="outline" size="sm">Завершить</Button>
                  </form>
                  <form action={cancelBookingAction}>
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <input type="hidden" name="reason" value="Teacher cancelled from dashboard" />
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4" />
                      Отменить
                    </Button>
                  </form>
                </div>
              </div>
              );
            }) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="font-medium text-slate-900">Заявок пока нет</p>
                <p className="mt-1 text-sm text-slate-500">Здесь появятся реальные бронирования учеников.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
