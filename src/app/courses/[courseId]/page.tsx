import Image from "next/image";
import { CheckCircle2, FileText, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/lib/mock-data";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = courses.find((item) => item.id === courseId) ?? courses[0];

  return (
    <AppShell>
      <main className="container py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-lg border bg-white shadow-soft">
            <div className="relative aspect-[16/7] bg-slate-100">
              <Image src={course.cover} alt={course.title} fill className="object-cover" sizes="100vw" />
            </div>
            <div className="p-6">
              <Badge>{course.author}</Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal">{course.title}</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Структурированный курс с видеоуроками, PDF-материалами, домашними заданиями и прогрессом ученика.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {["28 уроков", "PDF материалы", "Домашние задания"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <Card className="h-fit shadow-soft">
            <CardHeader>
              <CardTitle>{course.price.toLocaleString("ru-RU")} ₽</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">Купить курс</Button>
              <div className="mt-5 space-y-3">
                {["Глава 1: Фундамент", "Глава 2: Практика", "Глава 3: Проект"].map((chapter) => (
                  <div key={chapter} className="rounded-lg border p-3">
                    <p className="font-medium">{chapter}</p>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> Видео</span>
                      <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> PDF</span>
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
