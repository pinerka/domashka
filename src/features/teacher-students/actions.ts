"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDailyRoom } from "@/features/video/daily";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function buildLessonDate(date: string, time: string) {
  const rawStartsAt = new Date(`${date}T${time || "12:00"}:00`);
  const startsAt = rawStartsAt.getTime() < Date.now() ? new Date(Date.now() + 5 * 60 * 1000) : rawStartsAt;
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

async function getCurrentTeacherProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: teacherProfile, error } = await supabase
    .from("teacher_profiles")
    .select("id, profiles:profiles!teacher_profiles_user_id_fkey(full_name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !teacherProfile) {
    redirect("/profile?role=teacher&error=teacher_profile_required");
  }

  return teacherProfile as unknown as {
    id: string;
    profiles: { full_name: string } | { full_name: string }[] | null;
  };
}

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export async function addStudentToTeacherAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/teacher/students?demo=student-added");
  }

  const studentId = value(formData, "student_id");
  const teacherProfile = await getCurrentTeacherProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("teacher_students").upsert(
    {
      teacher_id: teacherProfile.id,
      student_id: studentId,
      status: "active"
    },
    { onConflict: "teacher_id,student_id" }
  );

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  revalidatePath("/teacher/students");
  redirect("/teacher/students?added=1");
}

export async function inviteStudentToLessonAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/teacher/students?demo=invited");
  }

  const studentId = value(formData, "student_id");
  const title = value(formData, "title") || "Урок";
  const date = value(formData, "date");
  const time = value(formData, "time");
  const { startsAt, endsAt } = buildLessonDate(date, time);

  const teacherProfile = await getCurrentTeacherProfile();
  const teacher = firstRelation(teacherProfile.profiles);
  const supabase = await createSupabaseServerClient();

  const { data: link } = await supabase
    .from("teacher_students")
    .select("id")
    .eq("teacher_id", teacherProfile.id)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (!link) {
    redirect("/teacher/students?error=student_not_attached");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      student_id: studentId,
      teacher_id: teacherProfile.id,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "pending"
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    redirect(`/teacher/students?error=${encodeURIComponent(bookingError?.message ?? "Не удалось создать приглашение")}`);
  }

  const { error: confirmError } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);

  if (confirmError) {
    redirect(`/teacher/students?error=${encodeURIComponent(confirmError.message)}`);
  }

  const { data: lesson } = await supabase.from("lessons").select("id").eq("booking_id", booking.id).maybeSingle();

  if (lesson?.id) {
    const room = await createDailyRoom({
      lessonId: lesson.id,
      title,
      startsAt,
      endsAt
    }).catch(() => null);

    await supabase
      .from("lessons")
      .update({
        title,
        video_provider: "daily",
        video_room_url: room?.roomUrl ?? null
      })
      .eq("id", lesson.id);
  }

  revalidatePath("/");
  revalidatePath("/student");
  revalidatePath("/teacher/bookings");
  revalidatePath("/teacher/students");
  redirect("/teacher/students?invited=1");
}
