import { AppShell } from "@/components/site/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/features/auth/actions";
import { GraduationCap, UserRound } from "lucide-react";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
        <Card className="w-full max-w-2xl rounded-[1.35rem] border-[#e3e4ef] shadow-[0_20px_70px_rgba(17,24,39,0.08)]">
          <CardHeader>
            <CardTitle className="text-3xl font-black tracking-normal">Создать аккаунт</CardTitle>
            <p className="text-slate-500">Выберите роль. Ее можно поменять позже в профиле.</p>
          </CardHeader>
          <CardContent>
            <form action={signUpAction} className="space-y-5">
              {params.error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {params.error}
                </p>
              ) : null}
              <Input name="full_name" placeholder="Имя" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="password" type="password" placeholder="Пароль" required />
              <div>
                <p className="mb-3 text-sm font-bold text-[#131525]">Кем вы будете пользоваться платформой?</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="cursor-pointer rounded-[1rem] border border-[#deddf1] bg-white p-5 transition has-[:checked]:border-[#675cff] has-[:checked]:bg-[#f4f2ff] has-[:checked]:shadow-[0_14px_34px_rgba(103,92,255,0.16)]">
                  <span className="flex items-start gap-4">
                    <input className="mt-1 h-4 w-4 accent-[#675cff]" type="radio" name="role" value="student" defaultChecked />
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efedff] text-[#675cff]">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-lg font-black text-[#131525]">Ученик</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">Ищу преподавателей, записываюсь на уроки и смотрю историю занятий.</span>
                    </span>
                  </span>
                </label>
                <label className="cursor-pointer rounded-[1rem] border border-[#deddf1] bg-white p-5 transition has-[:checked]:border-[#675cff] has-[:checked]:bg-[#f4f2ff] has-[:checked]:shadow-[0_14px_34px_rgba(103,92,255,0.16)]">
                  <span className="flex items-start gap-4">
                    <input className="mt-1 h-4 w-4 accent-[#675cff]" type="radio" name="role" value="teacher" />
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efedff] text-[#675cff]">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-lg font-black text-[#131525]">Преподаватель</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">Создаю уроки, веду профиль и появляюсь в разделе преподавателей.</span>
                    </span>
                  </span>
                </label>
              </div>
              </div>
              <Button className="h-12 w-full rounded-full bg-[#675cff] hover:bg-[#5b50f0]">Продолжить</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
