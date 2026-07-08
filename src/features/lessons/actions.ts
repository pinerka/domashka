"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createDailyRoom } from "@/features/video/daily";
import { encodeLessonParams, type PlannedLesson } from "@/features/lessons/types";

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
  const lessonId = crypto.randomUUID();
  const { startsAt, endsAt } = buildLessonDate(date, time);

  const room = await createDailyRoom({
    lessonId,
    title,
    startsAt,
    endsAt
  });

  const lesson: PlannedLesson = {
    id: lessonId,
    title,
    startsAt,
    endsAt,
    roomUrl: room.roomUrl,
    teacherName: "Pinerov Volodya",
    studentName: "Владимир"
  };

  const cookieStore = await cookies();
  const existingRaw = cookieStore.get("learnspace_lessons")?.value;
  const existingLessons = existingRaw ? (JSON.parse(existingRaw) as PlannedLesson[]) : [];
  const nextLessons = [lesson, ...existingLessons.filter((item) => item.id !== lesson.id)].slice(0, 12);

  cookieStore.set("learnspace_lessons", JSON.stringify(nextLessons), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  redirect(`/lesson/${lessonId}?${encodeLessonParams(lesson)}`);
}

export async function deleteLessonAction(formData: FormData) {
  const lessonId = value(formData, "lesson_id");
  const cookieStore = await cookies();
  const existingRaw = cookieStore.get("learnspace_lessons")?.value;
  const existingLessons = existingRaw ? (JSON.parse(existingRaw) as PlannedLesson[]) : [];
  const nextLessons = existingLessons.filter((item) => item.id !== lessonId);

  cookieStore.set("learnspace_lessons", JSON.stringify(nextLessons), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  redirect("/");
}
