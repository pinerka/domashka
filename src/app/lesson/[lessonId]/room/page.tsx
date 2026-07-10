import { cookies } from "next/headers";
import { LessonRoomClient } from "@/components/lesson-room/lesson-room-client";

export default async function LessonRoomPage({
  params,
  searchParams
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ title?: string; startsAt?: string; roomUrl?: string; guest?: string }>;
}) {
  const { lessonId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const savedRole = cookieStore.get("learnspace_role")?.value;
  const userRole = query.guest === "1" ? "guest" : savedRole === "teacher" ? "teacher" : "student";

  return (
    <LessonRoomClient
      lessonId={lessonId}
      title={query.title ?? "Урок"}
      startsAt={query.startsAt}
      roomUrl={query.roomUrl}
      userRole={userRole}
    />
  );
}
