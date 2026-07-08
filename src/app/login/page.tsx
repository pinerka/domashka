import Link from "next/link";
import { AppShell } from "@/components/site/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AppShell>
      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Вход</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={signInAction} className="space-y-3">
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="password" type="password" placeholder="Пароль" required />
              <Button className="w-full">Войти</Button>
              <div className="flex justify-between text-sm text-slate-500">
                <Link href="/forgot-password">Забыли пароль?</Link>
                <Link href="/register">Регистрация</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
