import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ExerciseEntry = {
  public_exercise_id: string | null;
  custom_exercise_id: string | null;
  user_id?: string | null;
  custom_exercise?: {
    name: string;
    exercise_type_id: string | null;
    primary_muscle: string | null;
    other_muscles: string[] | null;
  } | null;
};

export type ResolvedIds = {
  public_exercise_id: string | null;
  custom_exercise_id: string | null;
};

export type ResolveResult = {
  resolved: ResolvedIds;
  duplicated: boolean; // true if a new custom exercise was created for the user
} | null; // null = skip (cannot resolve)

/**
 * Resolves an exercise entry for a target user.
 *
 * - Public exercise: use as-is.
 * - Custom exercise the user owns: use as-is.
 * - Custom exercise from another user: try to match a public exercise by name,
 *   then fall back to duplicating it as the user's own custom exercise.
 *   Returns null if exercise details are unreadable (RLS blocked).
 */
export async function resolveExerciseForUser(
  supabase: SupabaseClient,
  userId: string,
  entry: ExerciseEntry
): Promise<ResolveResult> {
  // Public exercise - no resolution needed
  if (entry.public_exercise_id) {
    return {
      resolved: { public_exercise_id: entry.public_exercise_id, custom_exercise_id: null },
      duplicated: false,
    };
  }

  if (!entry.custom_exercise_id) return null;

  // User already owns this custom exercise - use as-is
  if (!entry.user_id || entry.user_id === userId) {
    return {
      resolved: { public_exercise_id: null, custom_exercise_id: entry.custom_exercise_id },
      duplicated: false,
    };
  }

  // Custom exercise from another user - need to resolve
  const ex = entry.custom_exercise;

  // RLS blocked the join - can't read the exercise, skip
  if (!ex?.name || !ex.exercise_type_id) return null;

  // 1. Match to a public exercise by name
  const { data: publicMatch } = await supabase
    .from("public_exercises")
    .select("id")
    .eq("name", ex.name)
    .maybeSingle();

  if (publicMatch?.id) {
    return {
      resolved: { public_exercise_id: publicMatch.id, custom_exercise_id: null },
      duplicated: false,
    };
  }

  // 2. Duplicate as the user's own custom exercise
  const { data: newCustom } = await supabase
    .from("custom_exercises")
    .insert({
      name: ex.name,
      user_id: userId,
      exercise_type_id: ex.exercise_type_id,
      primary_muscle: ex.primary_muscle ?? null,
      other_muscles: ex.other_muscles ?? null,
    })
    .select("id")
    .single();

  if (!newCustom?.id) return null;

  return {
    resolved: { public_exercise_id: null, custom_exercise_id: newCustom.id },
    duplicated: true,
  };
}
