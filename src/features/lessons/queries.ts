import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlannedLesson } from "@/features/lessons/types";

type LessonRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  video_room_url: string | null;
  teacher_profiles: {
    profiles: {
      full_name: string;
    } | {
      full_name: string;
    }[] | null;
  } | {
    profiles: {
      full_name: string;
    } | {
      full_name: string;
    }[] | null;
  }[] | null;
  lesson_participants: {
    role: string;
    profiles: {
      full_name: string;
    } | {
      full_name: string;
    }[] | null;
  }[];
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export async function getVisibleLessons() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("lessons")
    .select(
      `
        id,
        title,
        starts_at,
        ends_at,
        video_room_url,
        teacher_profiles(profiles(full_name)),
        lesson_participants(role, profiles(full_name))
      `
    )
    .order("starts_at", { ascending: true });

  return ((data ?? []) as unknown as LessonRow[]).map((lesson): PlannedLesson => {
    const teacherProfile = firstRelation(lesson.teacher_profiles);
    const teacherBaseProfile = firstRelation(teacherProfile?.profiles ?? null);
    const studentParticipant = lesson.lesson_participants.find((participant) => participant.role === "student");
    const studentProfile = firstRelation(studentParticipant?.profiles ?? null);

    return {
      id: lesson.id,
      title: lesson.title,
      startsAt: lesson.starts_at,
      endsAt: lesson.ends_at,
      roomUrl: lesson.video_room_url ?? "",
      teacherName: teacherBaseProfile?.full_name ?? "Преподаватель",
      studentName: studentProfile?.full_name ?? "Ученик"
    };
  });
}
