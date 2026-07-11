"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/features/permissions/permissions";

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function persistCurrentRole(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set("learnspace_role", role, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
}

async function ensureBaseProfile(user: { id: string; email?: string | null; user_metadata?: { full_name?: string } }, fullName?: string) {
  const supabase = await createSupabaseServerClient();
  const displayName = fullName?.trim() || user.user_metadata?.full_name?.trim() || user.email?.split("@")[0] || "Пользователь";

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: displayName,
    timezone: "Europe/Moscow",
    locale: "ru"
  });

  if (error) {
    throw error;
  }
}

async function ensureTeacherProfile(user: { id: string; email?: string | null }, fullName?: string) {
  const supabase = await createSupabaseServerClient();
  const displayName = fullName?.trim() || user.email?.split("@")[0] || "Преподаватель";
  const baseSlug = slugify(displayName) || `teacher-${user.id.slice(0, 8)}`;

  const { error } = await supabase.from("teacher_profiles").upsert(
    {
      user_id: user.id,
      slug: `${baseSlug}-${user.id.slice(0, 8)}`,
      headline: "Преподаватель LearnSpace",
      description: "Профиль преподавателя скоро будет заполнен.",
      hourly_rate: 0,
      currency: "RUB",
      experience_years: 0,
      status: "approved"
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/student?demo=auth");
  }

  const email = getValue(formData, "email");
  const password = getValue(formData, "password");
  const nextPath = getValue(formData, "next");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/student");
}

export async function signUpAction(formData: FormData) {
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");
  const fullName = getValue(formData, "full_name");
  const requestedRole = getValue(formData, "role");
  const role = (requestedRole === "teacher" ? "teacher" : "student") as UserRole;

  await persistCurrentRole(role);

  if (!isSupabaseConfigured()) {
    redirect(role === "teacher" ? "/profile?role=teacher&demo=auth" : "/student?demo=auth");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`
    }
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    try {
      await ensureBaseProfile(data.user, fullName);
    } catch (error) {
      redirect(`/register?error=${encodeURIComponent(error instanceof Error ? error.message : "Не удалось создать профиль")}`);
    }

    const { error: roleError } = await supabase.from("user_roles").upsert({ user_id: data.user.id, role });

    if (roleError) {
      redirect(`/register?error=${encodeURIComponent(roleError.message)}`);
    }

    if (role === "teacher") {
      try {
        await ensureTeacherProfile(data.user, fullName);
      } catch (error) {
        redirect(`/register?error=${encodeURIComponent(error instanceof Error ? error.message : "Не удалось создать профиль преподавателя")}`);
      }
    }
  }

  if (!data.session) {
    redirect(`/login?notice=${encodeURIComponent("Аккаунт создан. Проверьте почту и подтвердите email, затем войдите.")}`);
  }

  redirect(role === "teacher" ? "/teacher/profile" : "/student");
}

export async function updateRoleAction(formData: FormData) {
  const requestedRole = getValue(formData, "role");
  const role = (requestedRole === "teacher" ? "teacher" : "student") as UserRole;

  await persistCurrentRole(role);

  if (!isSupabaseConfigured()) {
    redirect(`/profile?role=${role}&saved=role`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await ensureBaseProfile(user);
  } catch (error) {
    redirect(`/profile?role=${role}&error=${encodeURIComponent(error instanceof Error ? error.message : "Не удалось создать профиль")}`);
  }

  const { error: deleteRoleError } = await supabase.from("user_roles").delete().eq("user_id", user.id).in("role", ["student", "teacher"]);

  if (deleteRoleError) {
    redirect(`/profile?error=${encodeURIComponent(deleteRoleError.message)}`);
  }

  const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  if (role === "teacher") {
    try {
      await ensureTeacherProfile(user, user.user_metadata?.full_name);
    } catch (error) {
      redirect(`/profile?role=teacher&error=${encodeURIComponent(error instanceof Error ? error.message : "Не удалось создать профиль преподавателя")}`);
    }
  }

  revalidatePath("/teachers");
  revalidatePath("/students");
  revalidatePath("/profile");
  redirect(`/profile?role=${role}&saved=role`);
}

export async function saveStudentProfileAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/profile?role=student&saved=profile");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = getValue(formData, "full_name");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    bio: getValue(formData, "student_notes"),
    timezone: getValue(formData, "timezone") || "Europe/Moscow",
    locale: "ru"
  });

  if (error) {
    redirect(`/profile?role=student&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  revalidatePath("/students");
  redirect("/profile?role=student&saved=profile");
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function deleteAccountAction() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    redirect(`/profile?deleteError=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("learnspace_role");
  cookieStore.delete("learnspace_lessons");
  redirect(`/login?notice=${encodeURIComponent("Аккаунт полностью удалён. Для входа зарегистрируйтесь заново.")}`);
}

export async function resetPasswordAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/forgot-password?demo=auth");
  }

  const email = getValue(formData, "email");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?sent=1");
}
