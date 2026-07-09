import { Save } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveTeacherProfileAction } from "@/features/teachers/actions";

export default function TeacherProfileEditorPage() {
  return (
    <AppShell>
      <main className="container py-10">
        <div className="mb-8">
          <Badge>Teacher profile</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Профиль преподавателя</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Здесь преподаватель создает и редактирует публичную витрину. Изменения применяются сразу.
          </p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveTeacherProfileAction} className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="full_name">Имя</label>
                  <Input id="full_name" name="full_name" placeholder="Как вас будут видеть ученики" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="slug">Публичный slug</label>
                  <Input id="slug" name="slug" placeholder="your-public-link" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="headline">Заголовок</label>
                  <Input id="headline" name="headline" placeholder="Кратко о специализации" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="description">Описание</label>
                  <Textarea id="description" name="description" placeholder="Расскажите об опыте, формате занятий и результатах учеников" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="hourly_rate">Цена за час</label>
                    <Input id="hourly_rate" name="hourly_rate" type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="experience_years">Опыт, лет</label>
                    <Input id="experience_years" name="experience_years" type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="timezone">Часовой пояс</label>
                    <Input id="timezone" name="timezone" placeholder="Europe/Moscow" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="intro_video_url">Видео-визитка</label>
                  <Input id="intro_video_url" name="intro_video_url" placeholder="https://..." />
                </div>
                <Button className="w-fit">
                  <Save className="h-4 w-4" />
                  Сохранить профиль
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
