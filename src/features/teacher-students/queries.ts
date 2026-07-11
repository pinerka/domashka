import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TeacherInvitation = {
  id: string;
  teacherName: string;
};

export async function getPendingTeacherInvitations(): Promise<TeacherInvitation[]> {
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
    .from("teacher_students")
    .select("id, teacher_profiles(profiles(full_name))")
    .eq("student_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const teacher = Array.isArray(row.teacher_profiles) ? row.teacher_profiles[0] : row.teacher_profiles;
    const profile = Array.isArray(teacher?.profiles) ? teacher.profiles[0] : teacher?.profiles;
    return { id: row.id, teacherName: profile?.full_name ?? "Преподаватель" };
  });
}
