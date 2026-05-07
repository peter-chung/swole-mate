import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/database.types";

type RoutineRow = Tables<"routines">;
type RoutineExerciseRow = Tables<"routine_exercises">;
type RoutineSetRow = Tables<"routine_sets">;

type UserSummary = {
  id: string;
  username: string | null;
  full_name: string | null;
};

export type RoutineWithRelations = RoutineRow & {
  user?: UserSummary | null;
  routine_exercises?: Array<
    RoutineExerciseRow & {
      exercise?: {
        id: string;
        name: string;
        exercise_type_label: string | null;
        has_weight: boolean | null;
        has_reps: boolean | null;
        has_duration: boolean | null;
        has_distance: boolean | null;
        is_bodyweight: boolean | null;
        is_assisted: boolean | null;
        primary_muscle: string | null;
      } | null;
      routine_sets?: Array<
        Pick<
          RoutineSetRow,
          | "id"
          | "set_number"
          | "reps"
          | "weight"
          | "duration"
          | "distance"
          | "notes"
        >
      >;
    }
  >;
};

export async function getRoutineWithRelations(
  routineId: string
): Promise<RoutineWithRelations | null> {
  if (!routineId) return null;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("routines")
    .select(
      `
        id, user_id, date, name, notes, started_at, ended_at, created_at,
        user:profiles ( id, username, full_name ),
        routine_exercises (
          id, public_exercise_id, custom_exercise_id, equipment_brand, order_index, notes,
          routine_sets ( id, set_number, reps, weight, duration, distance, notes )
        )
      `
    )
    .eq("id", routineId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;

  type RoutineData = RoutineRow & {
    user?: UserSummary | UserSummary[] | null;
    routine_exercises?: Array<
      RoutineExerciseRow & { routine_sets?: Array<RoutineSetRow> }
    > | null;
  };

  const {
    user: rawUser,
    routine_exercises: rawRoutineExercises,
    ...rest
  } = data as RoutineData;
  const base = rest as RoutineRow;
  const routineExercises = Array.isArray(rawRoutineExercises)
    ? rawRoutineExercises
    : [];

  const resolveExerciseId = (re: RoutineExerciseRow) =>
    re.public_exercise_id ?? re.custom_exercise_id ?? null;

  const exerciseIds = Array.from(
    new Set(
      routineExercises
        .map((re) => resolveExerciseId(re))
        .filter((id): id is string => Boolean(id))
    )
  );

  type ExerciseLookupEntry = {
    id: string;
    name: string;
    exercise_type_label: string | null;
    has_weight: boolean | null;
    has_reps: boolean | null;
    has_duration: boolean | null;
    has_distance: boolean | null;
    is_bodyweight: boolean | null;
    is_assisted: boolean | null;
    primary_muscle: string | null;
  };

  let exerciseLookup = new Map<string, ExerciseLookupEntry>();

  if (exerciseIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("available_exercises")
      .select("id, name, exercise_type_label, has_weight, has_reps, has_duration, has_distance, is_bodyweight, primary_muscle")
      .in("id", exerciseIds);

    if (!exercisesError) {
      exerciseLookup = new Map(
        (exercises ?? [])
          .filter((e): e is ExerciseLookupEntry => Boolean(e?.id))
          .map((e) => [e.id, e])
      );
    }
  }

  const enrichedExercises = routineExercises.map((re) => {
    const exerciseId = resolveExerciseId(re);
    return {
      ...re,
      exercise: exerciseId ? exerciseLookup.get(exerciseId) ?? null : null,
    };
  });

  const normalizedUser = Array.isArray(rawUser)
    ? rawUser[0] ?? null
    : rawUser ?? null;

  const withRelations: RoutineWithRelations = {
    ...base,
    user: normalizedUser,
    routine_exercises: enrichedExercises,
  };

  return withRelations;
}
