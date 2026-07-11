import { cookies } from "next/headers";
import { AppShell } from "@/components/site/app-shell";
import { LessonsDashboard } from "@/components/lessons/lessons-dashboard";
import { getVisibleLessons } from "@/features/lessons/queries";
import type { PlannedLesson } from "@/features/lessons/types";
import { getPendingTeacherInvitations } from "@/features/teacher-students/queries";

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

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const cookieLessons = readLessons(cookieStore.get("learnspace_lessons")?.value);
  const databaseLessons = await getVisibleLessons();
  const teacherInvitations = await getPendingTeacherInvitations();
  const plannedLessons = [...databaseLessons, ...cookieLessons.filter((cookieLesson) => !databaseLessons.some((lesson) => lesson.id === cookieLesson.id))];

  return (
    <AppShell>
      <LessonsDashboard plannedLessons={plannedLessons} canCreateLesson={false} teacherInvitations={teacherInvitations} />
    </AppShell>
  );
}
