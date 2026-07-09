import Link from "next/link";
import { AppShell } from "@/components/site/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/features/auth/actions";

function authMessage(error?: string, notice?: string) {
  if (notice) {
    return { tone: "info", text: notice };
  }

  if (!error) {
    return null;
  }

  if (error.toLowerCase().includes("email not confirmed")) {
    return { tone: "error", text: "Email еще не подтвержден. Проверьте почту и перейдите по ссылке подтверждения." };
  }

  if (error.toLowerCase().includes("invalid login credentials")) {
    return { tone: "error", text: "Неверный email или пароль." };
  }

  return { tone: "error", text: error };
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const message = authMessage(params.error, params.notice);

  return (
    <AppShell>
      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Вход</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={signInAction} className="space-y-3">
              {message ? (
                <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.tone === "error" ? "bg-red-50 text-red-700" : "bg-[#f4f2ff] text-[#5146d8]"}`}>
                  {message.text}
                </p>
              ) : null}
              <input type="hidden" name="next" value={params.next ?? ""} />
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
