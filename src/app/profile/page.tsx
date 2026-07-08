import { cookies } from "next/headers";
import { AppShell } from "@/components/site/app-shell";
import { ProfileSettings } from "@/components/profile/profile-settings";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ role?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedRole = cookieStore.get("learnspace_role")?.value;
  const currentRole = params.role === "teacher" || savedRole === "teacher" || params.demo === "role-teacher" ? "teacher" : "student";

  return (
    <AppShell>
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1280px] px-6 py-12">
        <header>
          <h1 className="text-4xl font-black tracking-normal text-[#121424]">Профиль</h1>
          <p className="mt-3 text-xl leading-7 text-slate-500">Здесь можно поменять роль и заполнить данные профиля.</p>
        </header>

        <ProfileSettings initialRole={currentRole} />
      </main>
    </AppShell>
  );
}
