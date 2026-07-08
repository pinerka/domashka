"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  return Number(text(formData, key) || 0);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function saveTeacherProfileAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/profile?role=teacher&saved=profile");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const headline = text(formData, "headline");
  const fullName = text(formData, "full_name");
  const slug = slugify(text(formData, "slug") || fullName || user.email || user.id);

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    bio: text(formData, "bio"),
    timezone: text(formData, "timezone") || "Europe/Moscow",
    locale: "ru"
  });

  const { error } = await supabase.from("teacher_profiles").upsert(
    {
      user_id: user.id,
      slug,
      headline,
      description: text(formData, "description"),
      hourly_rate: numberValue(formData, "hourly_rate"),
      currency: "RUB",
      experience_years: numberValue(formData, "experience_years"),
      intro_video_url: text(formData, "intro_video_url") || null,
      status: "approved"
    },
    { onConflict: "user_id" }
  );

  if (error) {
    redirect(`/profile?role=teacher&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/profile");
  revalidatePath("/teachers");
  revalidatePath(`/teachers/${slug}`);
  revalidatePath("/profile");
  redirect("/profile?role=teacher&saved=profile");
}
