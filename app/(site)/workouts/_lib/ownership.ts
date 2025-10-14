import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

type WorkoutExerciseWithWorkout = {
  id: number;
  workout_id: string;
  workout: { user_id: string };
};

export async function assertWorkoutExerciseOwnership(
  supabase: Supabase,
  userId: string,
  workoutId: string,
  workoutExerciseId: number
) {
  const { data } = await supabase
    .from("workout_exercises")
    .select("id, workout_id, workout:workouts!inner(user_id)")
    .eq("id", workoutExerciseId)
    .single();

  const workoutExercise = data as WorkoutExerciseWithWorkout | null;

  if (
    !workoutExercise ||
    workoutExercise.workout?.user_id !== userId ||
    workoutExercise.workout_id !== workoutId
  ) {
    return false;
  }

  return true;
}
