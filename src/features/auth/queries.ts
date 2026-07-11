import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSavedUserRole(): Promise<"student" | "teacher" | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["student", "teacher"])
    .limit(1)
    .maybeSingle();

  return data?.role === "teacher" ? "teacher" : data?.role === "student" ? "student" : null;
}
