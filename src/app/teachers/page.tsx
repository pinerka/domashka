import Link from "next/link";
import { CheckCircle2, Search, Star } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { teachers } from "@/lib/mock-data";

export default function TeachersPage() {
  return (
    <AppShell>
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1280px] px-6 py-12">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-normal text-[#121424]">Преподаватели</h1>
            <p className="mt-3 text-xl leading-7 text-slate-500">Найдите преподавателя и откройте его профиль.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input className="h-12 rounded-full border-[#deddf1] bg-white pl-12" placeholder="Имя или предмет" />
          </div>
        </header>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={teacher.avatar} alt={teacher.name} />
                      <AvatarFallback>{teacher.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-[#131525]">{teacher.name}</h2>
                        {teacher.verified ? <CheckCircle2 className="h-4 w-4 text-[#675cff]" /> : null}
                      </div>
                      <p className="text-sm text-slate-500">{teacher.experience}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {teacher.rating}
                  </span>
                </div>
                <p className="mt-5 font-semibold text-[#131525]">{teacher.headline}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{teacher.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <Badge key={subject} className="border-[#deddf1] bg-[#fbfbff]">{subject}</Badge>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[#ececf4] pt-5">
                  <p className="font-black">{teacher.price.toLocaleString("ru-RU")} ₽ / час</p>
                  <Button asChild className="rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
                    <Link href={`/teachers/${teacher.id}`}>Профиль</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
