import Link from "next/link";
import { CalendarCheck, CircleCheck, Clock, XCircle } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelBookingAction, completeLessonAction, confirmBookingAction } from "@/features/bookings/actions";

const bookings = [
  {
    id: "booking-demo-1",
    lessonId: "lesson-demo-1",
    student: "Никита Орлов",
    title: "IELTS Speaking: Part 2",
    time: "Сегодня, 19:00",
    status: "pending"
  },
  {
    id: "booking-demo-2",
    lessonId: "lesson-demo-2",
    student: "Алина Смирнова",
    title: "Mock interview",
    time: "Завтра, 17:30",
    status: "confirmed"
  }
];

export default function TeacherBookingsPage() {
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
            {bookings.map((booking) => (
              <div key={booking.id} className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{booking.title}</p>
                    <Badge>{booking.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{booking.student} · {booking.time}</p>
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
                      <Link href="/lesson/demo">
                        <Clock className="h-4 w-4" />
                        Открыть урок
                      </Link>
                    </Button>
                  )}
                  <form action={completeLessonAction}>
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <input type="hidden" name="lesson_id" value={booking.lessonId} />
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
            ))}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
