"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";
import { assertWorkoutExerciseOwnership } from "./_lib/ownership";
import { resolveExerciseForUser } from "@/app/_lib/resolveExercise";

type WorkoutRow = Tables<"workouts">;
type WorkoutInsert = TablesInsert<"workouts">;
type WorkoutUpdate = TablesUpdate<"workouts">;
type WorkoutExerciseRow = Tables<"workout_exercises">;
type ExerciseSetRow = Tables<"exercise_sets">;
type WorkoutExerciseWithSets = WorkoutExerciseRow & {
  exercise_sets?: Array<
    Pick<
      ExerciseSetRow,
      "set_number" | "reps" | "weight" | "duration" | "distance" | "notes"
    >
  > | null;
};
type WorkoutWithRelations = WorkoutRow & {
  workout_exercises?: WorkoutExerciseWithSets[] | null;
};

const WORKOUTS_PATH = "/workouts";

const normalizeEquipmentBrand = (brand?: string | null) => {
  const trimmed = brand?.trim();
  return trimmed ? trimmed : null;
};

type ExerciseSetSnapshot = Pick<
  ExerciseSetRow,
  "set_number" | "reps" | "weight" | "duration" | "distance" | "notes"
>;

const hasMeaningfulSetValue = (set: ExerciseSetSnapshot) => {
  const duration =
    typeof set.duration === "string" ? set.duration.trim() : set.duration;
  const notes = typeof set.notes === "string" ? set.notes.trim() : set.notes;

  return Boolean(
    set.reps != null ||
      set.weight != null ||
      set.distance != null ||
      duration ||
      notes
  );
};

const currentSetsLookAutoCopied = (
  currentSets: ExerciseSetSnapshot[],
  sourceSets: ExerciseSetSnapshot[]
) => {
  if (currentSets.length === 0 || currentSets.length !== sourceSets.length) {
    return false;
  }

  return currentSets.every((currentSet, index) => {
    const sourceSet = sourceSets[index];
    if (!sourceSet) return false;

    return (
      currentSet.set_number === index + 1 &&
      currentSet.reps === (sourceSet.reps ?? null) &&
      currentSet.weight === (sourceSet.weight ?? null) &&
      currentSet.duration == null &&
      currentSet.distance == null &&
      !currentSet.notes
    );
  });
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

export async function createWorkoutAction(payload: {
  name: string;
  date: string;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();

  const insertPayload: WorkoutInsert = {
    user_id: user.id,
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
    ...(payload.date !== undefined && { date: payload.date }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
  };

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("workouts")
    .update(updates)
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .select("id, name, date, notes")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(WORKOUTS_PATH);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return data as Pick<WorkoutRow, "id" | "name" | "date" | "notes">;
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

export async function copyWorkoutAction(workoutId: string) {
  const { supabase, user } = await ensureUser();

  if (!workoutId) {
    throw new Error("Missing workout id");
  }

  const { data: source, error: fetchError } = await supabase
    .from("workouts")
    .select(
      `
        id, name, date, notes,
        workout_exercises (
          id, notes, equipment_brand, order_index, public_exercise_id, custom_exercise_id, user_id,
          custom_exercise:custom_exercises ( name, exercise_type_id, primary_muscle, other_muscles ),
          exercise_sets ( set_number, reps, weight, duration, distance, notes )
        )
      `
    )
    .eq("id", workoutId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!source) {
    throw new Error("Workout not found");
  }

  const workoutSource = source as any;

  const { data: created, error: insertWorkoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: workoutSource.name
        ? `${workoutSource.name} (Copy)`
        : "Copied workout",
      notes: workoutSource.notes ?? null,
      date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (insertWorkoutError || !created?.id) {
    throw new Error(insertWorkoutError?.message ?? "Failed to copy workout");
  }

  const workoutExercises: any[] = workoutSource.workout_exercises ?? [];
  let skippedExercises = 0;
  let duplicatedAsCustom = 0;

  for (const workoutExercise of workoutExercises) {
    const result = await resolveExerciseForUser(supabase, user.id, {
      public_exercise_id: workoutExercise.public_exercise_id ?? null,
      custom_exercise_id: workoutExercise.custom_exercise_id ?? null,
      user_id: (workoutExercise as any).user_id ?? null,
      custom_exercise: (workoutExercise as any).custom_exercise ?? null,
    });

    if (!result) {
      skippedExercises += 1;
      continue;
    }

    if (result.duplicated) duplicatedAsCustom += 1;

    const { data: createdExercise, error: insertExerciseError } =
      await supabase
        .from("workout_exercises")
        .insert({
          workout_id: created.id,
          user_id: user.id,
          public_exercise_id: result.resolved.public_exercise_id,
          custom_exercise_id: result.resolved.custom_exercise_id,
          equipment_brand: workoutExercise.equipment_brand ?? null,
          notes: workoutExercise.notes ?? null,
          order_index: workoutExercise.order_index,
        })
        .select("id")
        .single();

    if (insertExerciseError || !createdExercise?.id) {
      throw new Error(
        insertExerciseError?.message ?? "Failed to copy workout exercise"
      );
    }

    const sets = workoutExercise.exercise_sets ?? [];
    if (!sets || sets.length === 0) continue;

    const setsPayload = sets.map((set: any) => ({
      workout_exercise_id: createdExercise.id,
      user_id: user.id,
      set_number: set.set_number,
      reps: set.reps ?? null,
      weight: set.weight ?? null,
      duration: set.duration ?? null,
      distance: set.distance ?? null,
      notes: set.notes ?? null,
    }));

    const { error: insertSetsError } = await supabase
      .from("exercise_sets")
      .insert(setsPayload);

    if (insertSetsError) throw new Error(insertSetsError.message);
  }

  revalidatePath(WORKOUTS_PATH);
  revalidatePath(`${WORKOUTS_PATH}/${created.id}`);
  revalidatePath(`${WORKOUTS_PATH}/${created.id}/edit`);

  return { id: created.id, skippedExercises, duplicatedAsCustom };
}

export async function addWorkoutExerciseAction({
  workoutId,
  exerciseId,
  equipmentBrand,
  notes,
}: {
  workoutId: string;
  exerciseId: string;
  equipmentBrand?: string | null;
  notes?: string | null;
}) {
  const { supabase, user } = await ensureUser();
  const normalizedEquipmentBrand = normalizeEquipmentBrand(equipmentBrand);

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
  const exerciseColumn = isCustomExercise
    ? "custom_exercise_id"
    : "public_exercise_id";

  let previousWorkoutExerciseQuery = supabase
    .from("workout_exercises")
    .select("id, equipment_brand, notes")
    .eq(exerciseColumn, exerciseId)
    .eq("user_id", user.id);

  if (normalizedEquipmentBrand) {
    previousWorkoutExerciseQuery = previousWorkoutExerciseQuery.ilike(
      "equipment_brand",
      normalizedEquipmentBrand
    );
  }

  let { data: previousWorkoutExercise } = await previousWorkoutExerciseQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!previousWorkoutExercise && normalizedEquipmentBrand) {
    const { data: previousAnyWorkoutExercise } = await supabase
      .from("workout_exercises")
      .select("id, equipment_brand, notes")
      .eq(exerciseColumn, exerciseId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    previousWorkoutExercise = previousAnyWorkoutExercise;
  }

  const initialEquipmentBrand =
    normalizedEquipmentBrand ?? previousWorkoutExercise?.equipment_brand ?? null;

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id: workoutId,
      user_id: user.id,
      public_exercise_id: isCustomExercise ? null : exerciseId,
      custom_exercise_id: isCustomExercise ? exerciseId : null,
      equipment_brand: initialEquipmentBrand,
      order_index: nextOrder,
      notes: notes ?? previousWorkoutExercise?.notes ?? null,
    })
    .select(
      "id, workout_id, public_exercise_id, custom_exercise_id, equipment_brand, order_index"
    )
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add exercise");
  }

  // Attempt to copy the most recent sets for this exercise so the user starts with familiar values.
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
    | "equipment_brand"
    | "order_index"
  >;
}

export async function updateWorkoutExerciseAction({
  workoutId,
  workoutExerciseId,
  equipmentBrand,
  notes,
  fillPreviousSets = true,
}: {
  workoutId: string;
  workoutExerciseId: number;
  equipmentBrand?: string | null;
  notes?: string | null;
  fillPreviousSets?: boolean;
}) {
  const { supabase, user } = await ensureUser();
  const normalizedEquipmentBrand = normalizeEquipmentBrand(equipmentBrand);

  const owns = await assertWorkoutExerciseOwnership(
    supabase,
    user.id,
    workoutId,
    workoutExerciseId
  );
  if (!owns) {
    throw new Error("Workout exercise not found");
  }

  const { data: workoutExercise, error: workoutExerciseError } = await supabase
    .from("workout_exercises")
    .select("id, public_exercise_id, custom_exercise_id, equipment_brand")
    .eq("id", workoutExerciseId)
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (workoutExerciseError || !workoutExercise) {
    throw new Error(
      workoutExerciseError?.message ?? "Workout exercise not found"
    );
  }

  const { data, error } = await supabase
    .from("workout_exercises")
    .update({ equipment_brand: normalizedEquipmentBrand, notes: notes?.trim() || null })
    .eq("id", workoutExerciseId)
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .select("id, equipment_brand, notes")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update exercise brand");
  }

  let copiedPreviousSets = false;
  let copiedSetCount = 0;
  let copiedFromBrand: string | null = null;
  let copiedMatchedBrand = false;

  const exerciseColumn = workoutExercise.custom_exercise_id
    ? "custom_exercise_id"
    : "public_exercise_id";
  const exerciseId =
    workoutExercise.custom_exercise_id ?? workoutExercise.public_exercise_id;

  if (fillPreviousSets && exerciseId) {
    let previousBrandExerciseQuery = supabase
      .from("workout_exercises")
      .select("id, equipment_brand")
      .eq(exerciseColumn, exerciseId)
      .eq("user_id", user.id)
      .neq("id", workoutExerciseId);

    previousBrandExerciseQuery = normalizedEquipmentBrand
      ? previousBrandExerciseQuery.ilike(
          "equipment_brand",
          normalizedEquipmentBrand
        )
      : previousBrandExerciseQuery.is("equipment_brand", null);

    const { data: previousBrandExercise } = await previousBrandExerciseQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let previousSourceExercise = previousBrandExercise;
    copiedMatchedBrand = Boolean(previousSourceExercise?.id);

    if (!previousSourceExercise?.id) {
      const { data: previousAnyExercise } = await supabase
        .from("workout_exercises")
        .select("id, equipment_brand")
        .eq(exerciseColumn, exerciseId)
        .eq("user_id", user.id)
        .neq("id", workoutExerciseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      previousSourceExercise = previousAnyExercise;
    }

    if (previousSourceExercise?.id) {
      const { data: previousBrandSets } = await supabase
        .from("exercise_sets")
        .select("set_number, reps, weight, duration, distance, notes")
        .eq("workout_exercise_id", previousSourceExercise.id)
        .order("set_number", { ascending: true });

      if ((previousBrandSets ?? []).length > 0) {
        const { data: currentSets } = await supabase
          .from("exercise_sets")
          .select("set_number, reps, weight, duration, distance, notes")
          .eq("workout_exercise_id", workoutExerciseId)
          .order("set_number", { ascending: true });

        const normalizedCurrentSets = (currentSets ?? []) as ExerciseSetSnapshot[];
        let canReplaceSets =
          normalizedCurrentSets.length === 0 ||
          normalizedCurrentSets.every((set) => !hasMeaningfulSetValue(set));

        if (!canReplaceSets) {
          let previousContextExerciseQuery = supabase
            .from("workout_exercises")
            .select("id")
            .eq(exerciseColumn, exerciseId)
            .eq("user_id", user.id)
            .neq("id", workoutExerciseId);

          previousContextExerciseQuery = workoutExercise.equipment_brand
            ? previousContextExerciseQuery.ilike(
                "equipment_brand",
                workoutExercise.equipment_brand
              )
            : previousContextExerciseQuery.is("equipment_brand", null);

          const { data: previousContextExercise } =
            await previousContextExerciseQuery
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

          if (previousContextExercise?.id) {
            const { data: previousContextSets } = await supabase
              .from("exercise_sets")
              .select("set_number, reps, weight, duration, distance, notes")
              .eq("workout_exercise_id", previousContextExercise.id)
              .order("set_number", { ascending: true });

            canReplaceSets = currentSetsLookAutoCopied(
              normalizedCurrentSets,
              (previousContextSets ?? []) as ExerciseSetSnapshot[]
            );
          }
        }

        if (!canReplaceSets) {
          const { data: previousAnyExercise } = await supabase
            .from("workout_exercises")
            .select("id")
            .eq(exerciseColumn, exerciseId)
            .eq("user_id", user.id)
            .neq("id", workoutExerciseId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (previousAnyExercise?.id) {
            const { data: previousAnySets } = await supabase
              .from("exercise_sets")
              .select("set_number, reps, weight, duration, distance, notes")
              .eq("workout_exercise_id", previousAnyExercise.id)
              .order("set_number", { ascending: true });

            canReplaceSets = currentSetsLookAutoCopied(
              normalizedCurrentSets,
              (previousAnySets ?? []) as ExerciseSetSnapshot[]
            );
          }
        }

        if (canReplaceSets) {
          const { error: deleteSetsError } = await supabase
            .from("exercise_sets")
            .delete()
            .eq("workout_exercise_id", workoutExerciseId);

          if (deleteSetsError) {
            throw new Error(deleteSetsError.message);
          }

          const setsPayload = (previousBrandSets ?? []).map((set, index) => ({
            workout_exercise_id: workoutExerciseId,
            user_id: user.id,
            set_number: index + 1,
            reps: set?.reps ?? null,
            weight: set?.weight ?? null,
            duration: set?.duration ?? null,
            distance: set?.distance ?? null,
            notes: null,
          }));

          const { error: insertSetsError } = await supabase
            .from("exercise_sets")
            .insert(setsPayload);

          if (insertSetsError) {
            throw new Error(insertSetsError.message);
          }

          copiedPreviousSets = true;
          copiedSetCount = setsPayload.length;
          copiedFromBrand = previousSourceExercise.equipment_brand ?? null;
        }
      }
    }
  }

  revalidatePath(`${WORKOUTS_PATH}/${workoutId}`);
  revalidatePath(`${WORKOUTS_PATH}/${workoutId}/edit`);

  return {
    ...(data as Pick<WorkoutExerciseRow, "id" | "equipment_brand">),
    copiedPreviousSets,
    copiedSetCount,
    copiedFromBrand,
    copiedMatchedBrand,
  };
}

export async function getWorkoutExerciseBrandSuggestionsAction({
  workoutId,
  workoutExerciseId,
  equipmentBrand,
}: {
  workoutId: string;
  workoutExerciseId: number;
  equipmentBrand?: string | null;
}) {
  const { supabase, user } = await ensureUser();
  const normalizedEquipmentBrand = normalizeEquipmentBrand(equipmentBrand);

  const owns = await assertWorkoutExerciseOwnership(
    supabase,
    user.id,
    workoutId,
    workoutExerciseId
  );
  if (!owns) {
    throw new Error("Workout exercise not found");
  }

  const { data: workoutExercise, error: workoutExerciseError } = await supabase
    .from("workout_exercises")
    .select("id, public_exercise_id, custom_exercise_id")
    .eq("id", workoutExerciseId)
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (workoutExerciseError || !workoutExercise) {
    throw new Error(
      workoutExerciseError?.message ?? "Workout exercise not found"
    );
  }

  const exerciseColumn = workoutExercise.custom_exercise_id
    ? "custom_exercise_id"
    : "public_exercise_id";
  const exerciseId =
    workoutExercise.custom_exercise_id ?? workoutExercise.public_exercise_id;

  if (!exerciseId) {
    return {
      equipmentBrand: normalizedEquipmentBrand,
      sets: [] as ExerciseSetSnapshot[],
      copiedFromBrand: null,
      matchedBrand: false,
    };
  }

  let previousBrandExerciseQuery = supabase
    .from("workout_exercises")
    .select("id, equipment_brand")
    .eq(exerciseColumn, exerciseId)
    .eq("user_id", user.id)
    .neq("id", workoutExerciseId);

  previousBrandExerciseQuery = normalizedEquipmentBrand
    ? previousBrandExerciseQuery.ilike(
        "equipment_brand",
        normalizedEquipmentBrand
      )
    : previousBrandExerciseQuery.is("equipment_brand", null);

  const { data: previousBrandExercise } = await previousBrandExerciseQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let previousSourceExercise = previousBrandExercise;
  const matchedBrand = Boolean(previousSourceExercise?.id);

  if (!previousSourceExercise?.id) {
    const { data: previousAnyExercise } = await supabase
      .from("workout_exercises")
      .select("id, equipment_brand")
      .eq(exerciseColumn, exerciseId)
      .eq("user_id", user.id)
      .neq("id", workoutExerciseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    previousSourceExercise = previousAnyExercise;
  }

  if (!previousSourceExercise?.id) {
    return {
      equipmentBrand: normalizedEquipmentBrand,
      sets: [] as ExerciseSetSnapshot[],
      copiedFromBrand: null,
      matchedBrand,
    };
  }

  const { data: previousSets, error: previousSetsError } = await supabase
    .from("exercise_sets")
    .select("set_number, reps, weight, duration, distance, notes")
    .eq("workout_exercise_id", previousSourceExercise.id)
    .order("set_number", { ascending: true });

  if (previousSetsError) {
    throw new Error(previousSetsError.message);
  }

  return {
    equipmentBrand: normalizedEquipmentBrand,
    sets: ((previousSets ?? []) as ExerciseSetSnapshot[]).map(
      (set, index) => ({
        set_number: index + 1,
        reps: set.reps ?? null,
        weight: set.weight ?? null,
        duration: set.duration ?? null,
        distance: set.distance ?? null,
        notes: null,
      })
    ),
    copiedFromBrand: previousSourceExercise.equipment_brand ?? null,
    matchedBrand,
  };
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
