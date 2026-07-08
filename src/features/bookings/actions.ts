"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createBookingAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/student?demo=booking-created");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const startsAt = value(formData, "starts_at");
  const endsAt = value(formData, "ends_at");
  const teacherId = value(formData, "teacher_id");

  const { error } = await supabase.from("bookings").insert({
    student_id: user.id,
    teacher_id: teacherId,
    starts_at: startsAt,
    ends_at: endsAt,
    status: "pending"
  });

  if (error) {
    redirect(`/teachers/${teacherId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/student");
  redirect("/student?booking=pending");
}

export async function confirmBookingAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/teacher/bookings?demo=confirmed");
  }

  const bookingId = value(formData, "booking_id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

  if (error) {
    redirect(`/teacher/bookings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/bookings");
  redirect("/teacher/bookings?confirmed=1");
}

export async function cancelBookingAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/teacher/bookings?demo=cancelled");
  }

  const bookingId = value(formData, "booking_id");
  const supabase = await createSupabaseServerClient();
  await supabase.from("bookings").update({ status: "cancelled", cancellation_reason: value(formData, "reason") }).eq("id", bookingId);

  revalidatePath("/teacher/bookings");
  redirect("/teacher/bookings?cancelled=1");
}

export async function completeLessonAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/teacher/bookings?demo=completed");
  }

  const lessonId = value(formData, "lesson_id");
  const bookingId = value(formData, "booking_id");
  const supabase = await createSupabaseServerClient();

  await supabase.from("lessons").update({ status: "completed" }).eq("id", lessonId);
  await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);

  revalidatePath("/teacher/bookings");
  revalidatePath("/student");
  redirect("/teacher/bookings?completed=1");
}
