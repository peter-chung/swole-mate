"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";
import { assertWorkoutExerciseOwnership } from "./_lib/ownership";

type WorkoutRow = Tables<"workouts">;
type WorkoutInsert = TablesInsert<"workouts">;
type WorkoutUpdate = TablesUpdate<"workouts">;
type WorkoutExerciseRow = Tables<"workout_exercises">;
type ExerciseSetRow = Tables<"exercise_sets">;

const WORKOUTS_PATH = "/workouts";

async function ensureUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function createWorkoutAction(payload: {
  name: string;
  date: string;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();

  const insertPayload: WorkoutInsert = {
    user_id: user.id,
    status: "draft",
    name: payload.name?.trim() || null,
    notes: payload.notes?.trim() || null,
    date: payload.date || new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabase
    .from("workouts")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create workout");
  }

  revalidatePath(WORKOUTS_PATH);
  return { id: data.id };
}

export async function updateWorkoutAction(
  workoutId: string,
  payload: Partial<WorkoutUpdate>
) {
  const { supabase, user } = await ensureUser();

  if (!workoutId) {
    throw new Error("Missing workout id");
  }

  const updates = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.status !== undefined && { status: payload.status }),
    ...(payload.date !== undefined && { date: payload.date }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
    ...(payload.started_at !== undefined && { started_at: payload.started_at }),
    ...(payload.ended_at !== undefined && { ended_at: payload.ended_at }),
  };

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("workouts")
    .update(updates)
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .select("id, name, status, date, notes, ended_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(WORKOUTS_PATH);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return data as Pick<
    WorkoutRow,
    "id" | "name" | "status" | "date" | "notes" | "ended_at"
  >;
}

export async function deleteWorkoutAction(workoutId: string) {
  const { supabase, user } = await ensureUser();

  if (!workoutId) {
    throw new Error("Missing workout id");
  }

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(WORKOUTS_PATH);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return { success: true };
}

export async function addWorkoutExerciseAction({
  workoutId,
  exerciseId,
  notes,
}: {
  workoutId: string;
  exerciseId: string;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();

  if (!workoutId || !exerciseId) {
    throw new Error("Invalid payload");
  }

  const { data: meta, error: metaError } = await supabase
    .from("available_exercises")
    .select("id, source, user_id")
    .eq("id", exerciseId)
    .maybeSingle();

  if (metaError || !meta?.id) {
    throw new Error(metaError?.message ?? "Exercise not found");
  }

  if (meta.source === "custom" && meta.user_id && meta.user_id !== user.id) {
    throw new Error("Exercise not accessible");
  }

  const isCustomExercise = meta.source === "custom";

  const { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workout) {
    throw new Error("Workout not found");
  }

  const { data: maxRow } = await supabase
    .from("workout_exercises")
    .select("order_index")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id: workoutId,
      user_id: user.id,
      public_exercise_id: isCustomExercise ? null : exerciseId,
      custom_exercise_id: isCustomExercise ? exerciseId : null,
      order_index: nextOrder,
      notes: notes ?? null,
    })
    .select(
      "id, workout_id, public_exercise_id, custom_exercise_id, order_index"
    )
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add exercise");
  }

  // Attempt to copy the most recent sets for this exercise so the user starts with familiar values.
  const { data: previousWorkoutExercise } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq(
      isCustomExercise ? "custom_exercise_id" : "public_exercise_id",
      exerciseId
    )
    .eq("user_id", user.id)
    .neq("id", data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousWorkoutExercise?.id) {
    const { data: previousSets, error: previousSetsError } = await supabase
      .from("exercise_sets")
      .select("set_number, reps, weight")
      .eq("workout_exercise_id", previousWorkoutExercise.id)
      .order("set_number", { ascending: true });

    if (previousSetsError) {
      console.error(previousSetsError);
    } else if ((previousSets ?? []).length > 0) {
      const setsPayload = (previousSets ?? []).map((set, index) => ({
        workout_exercise_id: data.id,
        user_id: user.id,
        set_number: index + 1,
        reps: set?.reps ?? null,
        weight: set?.weight ?? null,
        duration: null,
        distance: null,
        notes: null,
      }));

      const { error: insertSetsError } = await supabase
        .from("exercise_sets")
        .insert(setsPayload);

      if (insertSetsError) {
        console.error(insertSetsError);
      }
    }
  }

  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return data as Pick<
    WorkoutExerciseRow,
    | "id"
    | "workout_id"
    | "public_exercise_id"
    | "custom_exercise_id"
    | "order_index"
  >;
}

export async function saveExerciseSetAction({
  workoutId,
  workoutExerciseId,
  setId,
  payload,
}: {
  workoutId: string;
  workoutExerciseId: number;
  setId?: number;
  payload: {
    reps: number | null;
    weight: number | null;
    duration: string | null;
    distance: number | null;
    notes: string | null;
  };
}) {
  const { supabase, user } = await ensureUser();

  const owns = await assertWorkoutExerciseOwnership(
    supabase,
    user.id,
    workoutId,
    workoutExerciseId
  );
  if (!owns) {
    throw new Error("Workout exercise not found");
  }

  if (!setId) {
    const { data: maxSet } = await supabase
      .from("exercise_sets")
      .select("set_number")
      .eq("workout_exercise_id", workoutExerciseId)
      .order("set_number", { ascending: false })
      .limit(1)
      .single();

    const nextSetNumber = (maxSet?.set_number ?? 0) + 1;

    const { data, error } = await supabase
      .from("exercise_sets")
      .insert({
        workout_exercise_id: workoutExerciseId,
        user_id: user.id,
        set_number: nextSetNumber,
        reps: payload.reps ?? null,
        weight: payload.weight ?? null,
        duration: payload.duration ?? null,
        distance: payload.distance ?? null,
        notes: payload.notes ?? null,
      })
      .select("id, set_number, reps, weight, duration, distance, notes")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create exercise set");
    }

    revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
    revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

    return data as Pick<
      ExerciseSetRow,
      "id" | "set_number" | "reps" | "weight" | "duration" | "distance" | "notes"
    >;
  }

  const updates = {
    ...(payload.reps !== undefined && { reps: payload.reps }),
    ...(payload.weight !== undefined && { weight: payload.weight }),
    ...(payload.duration !== undefined && { duration: payload.duration }),
    ...(payload.distance !== undefined && { distance: payload.distance }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
  };

  const { data, error } = await supabase
    .from("exercise_sets")
    .update(updates)
    .eq("id", setId)
    .eq("workout_exercise_id", workoutExerciseId)
    .select("id, set_number, reps, weight, duration, distance, notes")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update exercise set");
  }

  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return data as Pick<
    ExerciseSetRow,
    "id" | "set_number" | "reps" | "weight" | "duration" | "distance" | "notes"
  >;
}

export async function deleteExerciseSetAction({
  workoutId,
  workoutExerciseId,
  setId,
}: {
  workoutId: string;
  workoutExerciseId: number;
  setId: number;
}) {
  const { supabase, user } = await ensureUser();

  const owns = await assertWorkoutExerciseOwnership(
    supabase,
    user.id,
    workoutId,
    workoutExerciseId
  );
  if (!owns) {
    throw new Error("Workout exercise not found");
  }

  const { error } = await supabase
    .from("exercise_sets")
    .delete()
    .eq("id", setId)
    .eq("workout_exercise_id", workoutExerciseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return { success: true };
}
