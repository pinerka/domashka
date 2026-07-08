import Image from "next/image";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { courses } from "@/lib/mock-data";

export default function CoursesPage() {
  return (
    <AppShell>
      <main className="container py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge>Course marketplace</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">Онлайн-курсы</h1>
            <p className="mt-2 text-slate-600">Курсы с главами, видео, PDF, домашними заданиями и покупками.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Создать курс
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="relative aspect-[16/8] bg-slate-100">
                <Image src={course.cover} alt={course.title} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{course.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{course.author} · {course.lessons} уроков</p>
                  </div>
                  <Badge>{course.price.toLocaleString("ru-RU")} ₽</Badge>
                </div>
                <Button asChild className="mt-5">
                  <Link href={`/courses/${course.id}`}>
                    <BookOpen className="h-4 w-4" />
                    Открыть курс
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
