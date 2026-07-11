import { cookies } from "next/headers";
import { AppShell } from "@/components/site/app-shell";
import { LessonsDashboard } from "@/components/lessons/lessons-dashboard";
import { getVisibleLessons } from "@/features/lessons/queries";
import { getSavedUserRole } from "@/features/auth/queries";
import { getPendingTeacherInvitations } from "@/features/teacher-students/queries";
import type { PlannedLesson } from "@/features/lessons/types";

export const dynamic = "force-dynamic";

function readLessons(raw?: string) {
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as PlannedLesson[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookieLessons = readLessons(cookieStore.get("learnspace_lessons")?.value);
  const databaseLessons = await getVisibleLessons();
  const [role, teacherInvitations] = await Promise.all([getSavedUserRole(), getPendingTeacherInvitations()]);
  const plannedLessons = [...databaseLessons, ...cookieLessons.filter((cookieLesson) => !databaseLessons.some((lesson) => lesson.id === cookieLesson.id))];

  return (
    <AppShell>
      <LessonsDashboard plannedLessons={plannedLessons} canCreateLesson={role === "teacher"} teacherInvitations={teacherInvitations} />
    </AppShell>
  );
}
