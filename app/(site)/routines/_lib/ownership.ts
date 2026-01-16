import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

type RoutineWithUser = {
  id: string;
  user_id: string;
};

type RoutineExerciseWithRoutine = {
  id: number;
  routine_id: string;
  routine: { user_id: string };
};

export async function assertRoutineOwnership(
  supabase: Supabase,
  userId: string,
  routineId: string
) {
  const { data } = await supabase
    .from("routines")
    .select("id, user_id")
    .eq("id", routineId)
    .maybeSingle();

  const routine = data as RoutineWithUser | null;

  if (!routine || routine.user_id !== userId) {
    return false;
  }

  return true;
}

export async function assertRoutineExerciseOwnership(
  supabase: Supabase,
  userId: string,
  routineId: string,
  routineExerciseId: number
) {
  const { data } = await supabase
    .from("routine_exercises")
    .select("id, routine_id, routine:routines!inner(user_id)")
    .eq("id", routineExerciseId)
    .single();

  const routineExercise = data as RoutineExerciseWithRoutine | null;

  if (
    !routineExercise ||
    routineExercise.routine?.user_id !== userId ||
    routineExercise.routine_id !== routineId
  ) {
    return false;
  }

  return true;
}
