"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Tables, TablesInsert } from "@/types/database.types";
import {
  assertRoutineOwnership,
  assertRoutineExerciseOwnership,
} from "./_lib/ownership";

type RoutineRow = Tables<"routines">;
type RoutineInsert = TablesInsert<"routines">;
type RoutineExerciseRow = Tables<"routine_exercises">;
type RoutineSetRow = Tables<"routine_sets">;

const ROUTINES_PATH = "/routines";

const normalizeEquipmentBrand = (brand?: string | null) => {
  const trimmed = brand?.trim();
  return trimmed ? trimmed : null;
};

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

export async function updateRoutineAction(
  routineId: string,
  payload: Partial<{
    name: string;
    date: string;
    notes: string;
    ended_at: string | null;
  }>
) {
  const { supabase, user } = await ensureUser();

  // Verify user owns this routine
  const ownsRoutine = await assertRoutineOwnership(
    supabase,
    user.id,
    routineId
  );
  if (!ownsRoutine) {
    throw new Error("Routine not found");
  }

  const updates: any = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.date !== undefined && { date: payload.date }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
    ...(payload.ended_at !== undefined && { ended_at: payload.ended_at }),
  };

  const hasUpdates = Object.keys(updates).length > 0;

  if (!hasUpdates) {
    const { data: existing } = await supabase
      .from("routines")
      .select("id, name, date, notes, ended_at")
      .eq("id", routineId)
      .eq("user_id", user.id)
      .single();

    return existing;
  }

  const { data, error } = await supabase
    .from("routines")
    .update(updates)
    .eq("id", routineId)
    .eq("user_id", user.id)
    .select("id, name, date, notes, ended_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`${ROUTINES_PATH}/${routineId}`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);

  return data;
}

export async function deleteRoutineAction(routineId: string) {
  const { supabase, user } = await ensureUser();

  // Verify user owns this routine
  const ownsRoutine = await assertRoutineOwnership(
    supabase,
    user.id,
    routineId
  );
  if (!ownsRoutine) {
    throw new Error("Routine not found");
  }

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(ROUTINES_PATH);
  return { success: true };
}

export async function addRoutineExerciseAction({
  routineId,
  exerciseId,
  equipmentBrand,
  notes,
}: {
  routineId: string;
  exerciseId: string;
  equipmentBrand?: string | null;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();
  const normalizedEquipmentBrand = normalizeEquipmentBrand(equipmentBrand);

  if (!routineId || !exerciseId) {
    throw new Error("Invalid payload");
  }

  // Verify user owns this routine
  const ownsRoutine = await assertRoutineOwnership(
    supabase,
    user.id,
    routineId
  );
  if (!ownsRoutine) {
    throw new Error("Routine not found");
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
      equipment_brand: normalizedEquipmentBrand,
      order_index: nextOrder,
      notes: notes ?? null,
    })
    .select(
      "id, routine_id, public_exercise_id, custom_exercise_id, equipment_brand, order_index"
    )
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add exercise");
  }

  // Try to copy previous sets for this exercise (best effort)
  let previousRoutineExerciseQuery = supabase
    .from("routine_exercises")
    .select("id")
    .eq(
      isCustomExercise ? "custom_exercise_id" : "public_exercise_id",
      exerciseId
    )
    .eq("user_id", user.id)
    .neq("id", data.id);

  if (normalizedEquipmentBrand) {
    previousRoutineExerciseQuery = previousRoutineExerciseQuery.ilike(
      "equipment_brand",
      normalizedEquipmentBrand
    );
  }

  const { data: previousRoutineExercise } = await previousRoutineExerciseQuery
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
    | "equipment_brand"
    | "order_index"
  >;
}

export async function updateRoutineExerciseAction({
  routineId,
  routineExerciseId,
  equipmentBrand,
}: {
  routineId: string;
  routineExerciseId: number;
  equipmentBrand?: string | null;
}) {
  const { supabase, user } = await ensureUser();

  const owns = await assertRoutineExerciseOwnership(
    supabase,
    user.id,
    routineId,
    routineExerciseId
  );
  if (!owns) {
    throw new Error("Routine exercise not found");
  }

  const { data, error } = await supabase
    .from("routine_exercises")
    .update({ equipment_brand: normalizeEquipmentBrand(equipmentBrand) })
    .eq("id", routineExerciseId)
    .eq("routine_id", routineId)
    .eq("user_id", user.id)
    .select("id, equipment_brand")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update exercise brand");
  }

  revalidatePath(`${ROUTINES_PATH}/${routineId}`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/edit`);
  revalidatePath(`${ROUTINES_PATH}/${routineId}/exercises/edit`);

  return data as Pick<RoutineExerciseRow, "id" | "equipment_brand">;
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

export async function startWorkoutFromRoutineAction(routineId: string) {
  const { supabase, user } = await ensureUser();

  if (!routineId) {
    throw new Error("Missing routine id");
  }

  // Verify user owns this routine
  const ownsRoutine = await assertRoutineOwnership(
    supabase,
    user.id,
    routineId
  );
  if (!ownsRoutine) {
    throw new Error("Routine not found");
  }

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .select(
      `
        id, name, date, notes,
        routine_exercises (
          id, notes, equipment_brand, order_index, public_exercise_id, custom_exercise_id, user_id,
          routine_sets ( set_number, reps, weight, duration, distance, notes )
        )
      `
    )
    .eq("id", routineId)
    .single();

  if (routineError || !routine) {
    throw new Error(routineError?.message ?? "Routine not found");
  }

  const routineData = routine as any;

  // Create workout from routine
  const { data: createdWorkout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: routineData.name || "Workout from routine",
      notes: routineData.notes ?? null,
      date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (workoutError || !createdWorkout?.id) {
    throw new Error(workoutError?.message ?? "Failed to create workout");
  }

  const workoutId = (createdWorkout as any).id;
  const routineExercises = routineData.routine_exercises ?? [];
  let skippedExercises = 0;

  for (const routineExercise of routineExercises) {
    const ownsCustomExercise =
      routineExercise.custom_exercise_id === null ||
      routineExercise.user_id === null ||
      routineExercise.user_id === user.id;

    if (!ownsCustomExercise) {
      skippedExercises += 1;
      continue;
    }

    const { data: createdExercise, error: exerciseError } = await supabase
      .from("workout_exercises")
      .insert({
        workout_id: workoutId,
        user_id: user.id,
        public_exercise_id: routineExercise.public_exercise_id,
        custom_exercise_id: ownsCustomExercise
          ? routineExercise.custom_exercise_id
          : null,
        equipment_brand: routineExercise.equipment_brand ?? null,
        notes: routineExercise.notes ?? null,
        order_index: routineExercise.order_index,
      })
      .select("id")
      .single();

    if (exerciseError || !createdExercise?.id) {
      throw new Error(
        exerciseError?.message ?? "Failed to add exercise to workout"
      );
    }

    const sets = routineExercise.routine_sets ?? [];
    if (!sets || sets.length === 0) {
      continue;
    }

    for (const set of sets) {
      const { error: setError } = await supabase.from("exercise_sets").insert({
        workout_exercise_id: (createdExercise as any).id,
        user_id: user.id,
        set_number: set.set_number,
        reps: set.reps ?? null,
        weight: set.weight ?? null,
        duration: set.duration ?? null,
        distance: set.distance ?? null,
        notes: set.notes ?? null,
      });

      if (setError) {
        throw new Error(setError.message ?? "Failed to add set to workout");
      }
    }
  }

  revalidatePath("/workouts");
  return { id: workoutId, skippedExercises };
}
