import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/database.types";

type WorkoutRow = Tables<"workouts">;

type UserSummary = {
  id: string;
  username: string | null;
  full_name: string | null;
};

export type WorkoutWithOwner = WorkoutRow & {
  user: UserSummary | null;
};

export async function getWorkoutsList(): Promise<WorkoutWithOwner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
        id, user_id, date, name, notes, status, started_at, ended_at, created_at,
        user:profiles ( id, username, full_name )
      `
    )
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => {
      const { user: rawUser, ...rest } = row as WorkoutRow & {
        user?: UserSummary | UserSummary[] | null;
      };

      const owner = Array.isArray(rawUser) ? rawUser[0] ?? null : rawUser ?? null;

      return {
        ...rest,
        user: owner,
      };
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdB - createdA;
    });
}
