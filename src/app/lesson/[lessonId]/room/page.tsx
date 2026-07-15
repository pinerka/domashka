import { cookies } from "next/headers";
import { LessonRoomClient } from "@/components/lesson-room/lesson-room-client";
import { getSavedUserRole } from "@/features/auth/queries";
import { createDailyRoom } from "@/features/video/daily";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LessonRoomPage({
  params,
  searchParams
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ title?: string; startsAt?: string; roomUrl?: string }>;
}) {
  const { lessonId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const savedRole = cookieStore.get("learnspace_role")?.value;
  const databaseRole = await getSavedUserRole();
  const userRole = databaseRole ?? (savedRole === "teacher" ? "teacher" : "student");
  let title = query.title ?? "Урок";
  let startsAt = query.startsAt;
  let roomUrl = query.roomUrl;
  let lessonStatus: "scheduled" | "live" | "completed" | "cancelled" = "scheduled";

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: lesson } = await supabase
      .from("lessons")
      .select("title, starts_at, ends_at, video_room_url, status")
      .eq("id", lessonId)
      .maybeSingle();

    if (lesson) {
      title = lesson.title;
      startsAt = lesson.starts_at;
      roomUrl = lesson.video_room_url ?? undefined;
      lessonStatus = lesson.status;

      if (!roomUrl) {
        const room = await createDailyRoom({
          lessonId,
          title,
          startsAt: lesson.starts_at,
          endsAt: lesson.ends_at
        }).catch(() => null);

        roomUrl = room?.roomUrl;

        if (roomUrl) {
          await supabase.rpc("save_lesson_video_room", {
            target_lesson_id: lessonId,
            target_room_url: roomUrl
          });
        }
      }
    }
  }

  return (
    <LessonRoomClient
      lessonId={lessonId}
      title={title}
      startsAt={startsAt}
      roomUrl={roomUrl}
      userRole={userRole}
      lessonStatus={lessonStatus}
    />
  );
}
