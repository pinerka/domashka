import { cookies } from "next/headers";
import { AppShell } from "@/components/site/app-shell";
import { LessonsDashboard } from "@/components/lessons/lessons-dashboard";
import type { PlannedLesson } from "@/features/lessons/types";

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
  const plannedLessons = readLessons(cookieStore.get("learnspace_lessons")?.value);

  return (
    <AppShell>
      <LessonsDashboard plannedLessons={plannedLessons} />
    </AppShell>
  );
}
