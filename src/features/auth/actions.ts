"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/features/permissions/permissions";

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function persistCurrentRole(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set("learnspace_role", role, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/student?demo=auth");
  }

  const email = getValue(formData, "email");
  const password = getValue(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/student");
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
      }
    }
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      timezone: "Europe/Moscow",
      locale: "ru"
    });
    await supabase.from("user_roles").upsert({ user_id: data.user.id, role });
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

  await supabase.from("user_roles").delete().eq("user_id", user.id).in("role", ["student", "teacher"]);
  const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/profile?role=${role}&saved=role`);
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
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
