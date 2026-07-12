"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDailyRoom } from "@/features/video/daily";
import { encodeLessonParams, type PlannedLesson } from "@/features/lessons/types";
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

export async function createLessonAction(formData: FormData) {
  const title = value(formData, "title") || "Новый урок";
  const date = value(formData, "date");
  const time = value(formData, "time");
  const studentId = value(formData, "student_id");
  const { startsAt, endsAt } = buildLessonDate(date, time);

  if (!isSupabaseConfigured()) {
    redirect("/lessons/new?error=Supabase%20не%20подключен");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: teacherProfile } = await supabase
    .from("teacher_profiles")
    .select("id, profiles:profiles!teacher_profiles_user_id_fkey(full_name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!teacherProfile) {
    redirect("/lessons/new?error=Профиль%20преподавателя%20не%20найден");
  }

  const { data: studentLink } = await supabase
    .from("teacher_students")
    .select("student_id, profiles:profiles!teacher_students_student_id_fkey(full_name)")
    .eq("teacher_id", teacherProfile.id)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (!studentLink) {
    redirect("/lessons/new?error=Выберите%20ученика%20из%20списка");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({ student_id: studentId, teacher_id: teacherProfile.id, starts_at: startsAt, ends_at: endsAt, status: "pending" })
    .select("id")
    .single();

  if (bookingError || !booking) {
    if (bookingError?.code === "23505") {
      revalidatePath("/");
      revalidatePath("/student");
      redirect("/");
    }

    redirect(`/lessons/new?error=${encodeURIComponent(bookingError?.message ?? "Не удалось создать урок")}`);
  }

  const { error: confirmError } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);

  if (confirmError) {
    redirect(`/lessons/new?error=${encodeURIComponent(confirmError.message)}`);
  }

  const { data: createdLesson, error: lessonError } = await supabase.from("lessons").select("id").eq("booking_id", booking.id).maybeSingle();

  if (lessonError || !createdLesson) {
    redirect(`/lessons/new?error=${encodeURIComponent(lessonError?.message ?? "Урок не был создан")}`);
  }

  let room;

  try {
    room = await createDailyRoom({ lessonId: createdLesson.id, title, startsAt, endsAt });
  } catch (error) {
    redirect(`/lessons/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Не удалось создать видеокомнату")}`);
  }

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ title, video_provider: "daily", video_room_url: room.roomUrl })
    .eq("id", createdLesson.id);

  if (updateError) {
    redirect(`/lessons/new?error=${encodeURIComponent(updateError.message)}`);
  }

  const teacherRelation = teacherProfile.profiles as unknown as { full_name: string } | { full_name: string }[] | null;
  const studentRelation = studentLink.profiles as unknown as { full_name: string } | { full_name: string }[] | null;
  const teacherName = (Array.isArray(teacherRelation) ? teacherRelation[0]?.full_name : teacherRelation?.full_name) ?? "Преподаватель";
  const studentName = (Array.isArray(studentRelation) ? studentRelation[0]?.full_name : studentRelation?.full_name) ?? "Ученик";
  const lesson: PlannedLesson = {
    id: createdLesson.id,
    title,
    startsAt,
    endsAt,
    roomUrl: room.roomUrl,
    teacherName,
    studentName
  };

  revalidatePath("/");
  revalidatePath("/student");
  redirect(`/lesson/${createdLesson.id}?${encodeLessonParams(lesson)}`);
}

export async function deleteLessonAction(formData: FormData) {
  const lessonId = value(formData, "lesson_id");

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { error } = await supabase.rpc("delete_own_lesson", {
      target_lesson_id: lessonId
    });

    if (error) {
      redirect(`/lesson/${lessonId}?deleteError=${encodeURIComponent(error.message)}`);
    }
  }

  const cookieStore = await cookies();
  const existingRaw = cookieStore.get("learnspace_lessons")?.value;
  const existingLessons = existingRaw ? (JSON.parse(existingRaw) as PlannedLesson[]) : [];
  const nextLessons = existingLessons.filter((item) => item.id !== lessonId);

  cookieStore.set("learnspace_lessons", JSON.stringify(nextLessons), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  revalidatePath("/");
  revalidatePath("/student");
  redirect("/");
}

export async function finishLessonAction(formData: FormData) {
  const lessonId = value(formData, "lesson_id");

  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: finished, error } = await supabase.rpc("finish_own_lesson", {
    target_lesson_id: lessonId
  });

  if (error || !finished) {
    redirect(`/lesson/${lessonId}?finishError=${encodeURIComponent(error?.message ?? "Завершить урок может только преподаватель")}`);
  }

  revalidatePath("/");
  revalidatePath("/student");
  redirect("/");
}
