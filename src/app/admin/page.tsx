import { AlertTriangle, BadgeCheck, Banknote, Users } from "lucide-react";
import { AppShell } from "@/components/site/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <AppShell>
      <main className="container py-10">
        <div className="mb-8">
          <Badge>Admin panel</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Операционная панель</h1>
          <p className="mt-2 text-slate-600">Модерация преподавателей, курсов, жалоб, финансов и продвижения.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Пользователи", "12 840", Users],
            ["На проверке", "28", BadgeCheck],
            ["Жалобы", "6", AlertTriangle],
            ["GMV", "8.4M ₽", Banknote]
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Заявки преподавателей</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Екатерина Белова · Английский", "Дмитрий Петров · Физика", "Olga Chen · Product Analytics"].map((item) => (
              <div key={item} className="flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-medium">{item}</p>
                  <p className="mt-1 text-sm text-slate-500">Документы загружены, профиль ожидает ревью.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Отклонить</Button>
                  <Button size="sm">Подтвердить</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
