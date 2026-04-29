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
  exerciseCount: number;
  exerciseNames: string[];
};

export async function getWorkoutsList(): Promise<WorkoutWithOwner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
        id, user_id, date, name, notes, created_at,
        user:profiles ( id, username, full_name ),
        workout_exercises ( id, public_exercise_id, custom_exercise_id, order_index )
      `
    )
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  // Collect all unique exercise IDs across all workouts
  const allExerciseIds = Array.from(
    new Set(
      data.flatMap((w: any) =>
        (w.workout_exercises ?? []).map(
          (we: any) => we.public_exercise_id ?? we.custom_exercise_id ?? null
        ).filter(Boolean)
      )
    )
  ) as string[];

  const exerciseNameMap = new Map<string, string>();

  if (allExerciseIds.length > 0) {
    const { data: exercises } = await supabase
      .from("available_exercises")
      .select("id, name")
      .in("id", allExerciseIds);

    for (const ex of exercises ?? []) {
      if (ex.id && ex.name) exerciseNameMap.set(ex.id, ex.name);
    }
  }

  return data
    .map((row: any) => {
      const { user: rawUser, workout_exercises: rawExercises, ...rest } = row;
      const owner = Array.isArray(rawUser) ? rawUser[0] ?? null : rawUser ?? null;
      const exercises: any[] = Array.isArray(rawExercises) ? rawExercises : [];

      const ordered = exercises
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

      const exerciseNames = ordered
        .map((we) => {
          const id = we.public_exercise_id ?? we.custom_exercise_id ?? null;
          return id ? (exerciseNameMap.get(id) ?? null) : null;
        })
        .filter((n): n is string => n !== null);

      return {
        ...(rest as WorkoutRow),
        user: owner,
        exerciseCount: exercises.length,
        exerciseNames,
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
