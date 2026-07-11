import { cookies } from "next/headers";
import { AppShell } from "@/components/site/app-shell";
import { ProfileSettings, type ProfileFormValues } from "@/components/profile/profile-settings";
import { getSavedUserRole } from "@/features/auth/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getProfileValues(): Promise<ProfileFormValues> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  const [{ data: profile }, { data: teacherProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name, bio, timezone").eq("id", user.id).maybeSingle(),
    supabase
      .from("teacher_profiles")
      .select("slug, headline, description, hourly_rate, experience_years, intro_video_url")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  return {
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
    bio: profile?.bio ?? "",
    timezone: profile?.timezone ?? "Europe/Moscow",
    teacher: teacherProfile
      ? {
          slug: teacherProfile.slug,
          headline: teacherProfile.headline,
          description: teacherProfile.description,
          hourlyRate: teacherProfile.hourly_rate,
          experienceYears: teacherProfile.experience_years,
          introVideoUrl: teacherProfile.intro_video_url
        }
      : null
  };
}

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ role?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedRole = cookieStore.get("learnspace_role")?.value;
  const [databaseRole, values] = await Promise.all([getSavedUserRole(), getProfileValues()]);
  const currentRole = databaseRole ?? (params.role === "teacher" || savedRole === "teacher" || params.demo === "role-teacher" ? "teacher" : "student");

  return (
    <AppShell>
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1280px] px-6 py-12">
        <header>
          <h1 className="text-4xl font-black tracking-normal text-[#121424]">Профиль</h1>
          <p className="mt-3 text-xl leading-7 text-slate-500">Здесь можно поменять роль и заполнить данные профиля.</p>
        </header>

        <ProfileSettings initialRole={currentRole} values={values} />
      </main>
    </AppShell>
  );
}
