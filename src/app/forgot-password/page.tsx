import { AppShell } from "@/components/site/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/features/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <AppShell>
      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={resetPasswordAction} className="space-y-3">
              <Input name="email" type="email" placeholder="Email" required />
              <Button className="w-full">Отправить ссылку</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
