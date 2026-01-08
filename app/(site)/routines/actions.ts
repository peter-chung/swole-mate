"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Tables, TablesInsert } from "@/types/database.types";
import { assertRoutineExerciseOwnership } from "./_lib/ownership";

type RoutineRow = Tables<"routines">;
type RoutineInsert = TablesInsert<"routines">;
type RoutineExerciseRow = Tables<"routine_exercises">;
type RoutineSetRow = Tables<"routine_sets">;

const ROUTINES_PATH = "/routines";

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

export async function createRoutineAction(payload: {
  name: string;
  date: string;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();

  const insertPayload: RoutineInsert = {
    user_id: user.id,
    status: "draft",
    name: payload.name?.trim() || null,
    notes: payload.notes?.trim() || null,
    date: payload.date || new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabase
    .from("routines")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create routine");
  }

  revalidatePath(ROUTINES_PATH);
  return { id: data.id };
}

export async function addRoutineExerciseAction({
  routineId,
  exerciseId,
  notes,
}: {
  routineId: string;
  exerciseId: string;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();

  if (!routineId || !exerciseId) {
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

  const { data: routine } = await supabase
    .from("routines")
    .select("id")
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!routine) {
    throw new Error("Routine not found");
  }

  const { data: maxRow } = await supabase
    .from("routine_exercises")
    .select("order_index")
    .eq("routine_id", routineId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from("routine_exercises")
    .insert({
      routine_id: routineId,
      user_id: user.id,
      public_exercise_id: isCustomExercise ? null : exerciseId,
      custom_exercise_id: isCustomExercise ? exerciseId : null,
      order_index: nextOrder,
      notes: notes ?? null,
    })
    .select(
      "id, routine_id, public_exercise_id, custom_exercise_id, order_index"
    )
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add exercise");
  }

  // Try to copy previous sets for this exercise (best effort)
  const { data: previousRoutineExercise } = await supabase
    .from("routine_exercises")
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

  if (previousRoutineExercise?.id) {
    const { data: previousSets, error: previousSetsError } = await supabase
      .from("routine_sets")
      .select("set_number, reps, weight")
      .eq("routine_exercise_id", previousRoutineExercise.id)
      .order("set_number", { ascending: true });

    if (!previousSetsError && (previousSets ?? []).length > 0) {
      const setsPayload = (previousSets ?? []).map(
        (set: any, index: number) => ({
          routine_exercise_id: data.id,
          user_id: user.id,
          set_number: index + 1,
          reps: set?.reps ?? null,
          weight: set?.weight ?? null,
          duration: null,
          distance: null,
          notes: null,
        })
      );

      const { error: insertSetsError } = await supabase
        .from("routine_sets")
        .insert(setsPayload);

      if (insertSetsError) console.error(insertSetsError);
    }
  }

  revalidatePath(`${ROUTINES_PATH}/${routineId}`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);

  return data as Pick<
    RoutineExerciseRow,
    | "id"
    | "routine_id"
    | "public_exercise_id"
    | "custom_exercise_id"
    | "order_index"
  >;
}

export async function saveRoutineSetAction({
  routineId,
  routineExerciseId,
  setId,
  payload,
}: {
  routineId: string;
  routineExerciseId: number;
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

  const owns = await assertRoutineExerciseOwnership(
    supabase,
    user.id,
    routineId,
    routineExerciseId
  );
  if (!owns) throw new Error("Routine exercise not found");

  if (!setId) {
    const { data: maxSet } = await supabase
      .from("routine_sets")
      .select("set_number")
      .eq("routine_exercise_id", routineExerciseId)
      .order("set_number", { ascending: false })
      .limit(1)
      .single();

    const nextSetNumber = (maxSet?.set_number ?? 0) + 1;

    const { data, error } = await supabase
      .from("routine_sets")
      .insert({
        routine_exercise_id: routineExerciseId,
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

    if (error || !data)
      throw new Error(error?.message ?? "Failed to create routine set");

    revalidatePath(`${ROUTINES_PATH}/${routineId}`);
    revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);

    return data as Pick<
      RoutineSetRow,
      | "id"
      | "set_number"
      | "reps"
      | "weight"
      | "duration"
      | "distance"
      | "notes"
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
    .from("routine_sets")
    .update(updates)
    .eq("id", setId)
    .eq("routine_exercise_id", routineExerciseId)
    .select("id, set_number, reps, weight, duration, distance, notes")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to update routine set");

  revalidatePath(`${ROUTINES_PATH}/${routineId}`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);

  return data as Pick<
    RoutineSetRow,
    "id" | "set_number" | "reps" | "weight" | "duration" | "distance" | "notes"
  >;
}

export async function deleteRoutineSetAction({
  routineId,
  routineExerciseId,
  setId,
}: {
  routineId: string;
  routineExerciseId: number;
  setId: number;
}) {
  const { supabase, user } = await ensureUser();

  const owns = await assertRoutineExerciseOwnership(
    supabase,
    user.id,
    routineId,
    routineExerciseId
  );
  if (!owns) throw new Error("Routine exercise not found");

  const { error } = await supabase
    .from("routine_sets")
    .delete()
    .eq("id", setId)
    .eq("routine_exercise_id", routineExerciseId);

  if (error) throw new Error(error.message);

  revalidatePath(`${ROUTINES_PATH}/${routineId}`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);

  return { success: true };
}

export async function deleteRoutineExerciseAction({
  routineId,
  routineExerciseId,
}: {
  routineId: string;
  routineExerciseId: number;
}) {
  const { supabase, user } = await ensureUser();

  // ensure routine exists and belongs to user
  const { data: routine } = await supabase
    .from("routines")
    .select("id")
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!routine) throw new Error("Routine not found");

  const { error } = await supabase
    .from("routine_exercises")
    .delete()
    .eq("id", routineExerciseId)
    .eq("routine_id", routineId);

  if (error) throw new Error(error.message);

  revalidatePath(`${ROUTINES_PATH}/${routineId}`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);

  return { success: true };
}
