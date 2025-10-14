import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/database.types";

type WorkoutRow = Tables<"workouts">;
type WorkoutExerciseRow = Tables<"workout_exercises">;
type ExerciseSetRow = Tables<"exercise_sets">;

type UserSummary = {
  id: string;
  username: string | null;
  full_name: string | null;
};

export type WorkoutWithRelations = WorkoutRow & {
  user?: UserSummary | null;
  workout_exercises?: Array<
    WorkoutExerciseRow & {
      exercise?: {
        id: string;
        name: string;
        exercise_type_label: string | null;
      } | null;
      exercise_sets?: Array<
        Pick<
          ExerciseSetRow,
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

export async function getWorkoutWithRelations(
  workoutId: string
): Promise<WorkoutWithRelations | null> {
  if (!workoutId) return null;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
        id, user_id, date, name, notes, status, started_at, ended_at, created_at,
        user:users ( id, username, full_name ),
        workout_exercises (
          id, public_exercise_id, custom_exercise_id, order_index, notes,
          exercise_sets ( id, set_number, reps, weight, duration, distance, notes )
        )
      `
    )
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;

  type WorkoutData = WorkoutRow & {
    user?: UserSummary | UserSummary[] | null;
    workout_exercises?: Array<
      WorkoutExerciseRow & {
        exercise_sets?: Array<ExerciseSetRow>;
      }
    > | null;
  };

  const {
    user: rawUser,
    workout_exercises: rawWorkoutExercises,
    ...rest
  } = data as WorkoutData;

  const baseWorkout = rest as WorkoutRow;

  const workoutExercises: Array<
    WorkoutExerciseRow & {
      exercise_sets?: Array<ExerciseSetRow>;
    }
  > = Array.isArray(rawWorkoutExercises) ? rawWorkoutExercises : [];

  const resolveExerciseId = (we: WorkoutExerciseRow) =>
    we.public_exercise_id ?? we.custom_exercise_id ?? null;

  const exerciseIds = Array.from(
    new Set(
      workoutExercises
        .map((we) => resolveExerciseId(we))
        .filter((exerciseId): exerciseId is string => Boolean(exerciseId))
    )
  );

  let exerciseLookup = new Map<
    string,
    { id: string; name: string; exercise_type_label: string | null }
  >();

  if (exerciseIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("available_exercises")
      .select("id, name, exercise_type_label")
      .in("id", exerciseIds);

    if (!exercisesError) {
      exerciseLookup = new Map(
        (exercises ?? [])
          .filter(
            (
              exercise
            ): exercise is {
              id: string;
              name: string;
              exercise_type_label: string | null;
            } => Boolean(exercise?.id)
          )
          .map((exercise) => [exercise.id, exercise])
      );
    }
  }

  const enrichedExercises = workoutExercises.map((we) => {
    const exerciseId = resolveExerciseId(we);
    return {
      ...we,
      exercise: exerciseId ? exerciseLookup.get(exerciseId) ?? null : null,
    };
  });

  const normalizedUser = Array.isArray(rawUser)
    ? rawUser[0] ?? null
    : rawUser ?? null;

  const withRelations: WorkoutWithRelations = {
    ...baseWorkout,
    user: normalizedUser,
    workout_exercises: enrichedExercises,
  };

  return withRelations;
}
