// app/api/workouts/[workoutId]/workout-exercises/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ workoutId: string }> };
// type Workout = Database["public"]["Tables"]["workouts"]["Row"];

export async function GET(req: Request, { params }: Params) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workoutId } = await params;

  // Ensure the workout exists and belongs to the user
  const { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch workout exercises with nested sets
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      id, workout_id, exercise_id, order_index, notes,
      exercise_sets ( id, set_number, reps, weight, duration, distance, notes )
    `
    )
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true })
    .order("set_number", { ascending: true, foreignTable: "exercise_sets" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const workoutExercises = data ?? [];
  const exerciseIds = Array.from(
    new Set(
      workoutExercises
        .map((we) => we.exercise_id)
        .filter((exerciseId): exerciseId is string => Boolean(exerciseId))
    )
  );

  let exerciseLookup = new Map<string, { id: string; name: string; exercise_type_label: string | null }>();

  if (exerciseIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("available_exercises")
      .select("id, name, exercise_type_label")
      .in("id", exerciseIds);

    if (exercisesError) {
      return NextResponse.json({ error: exercisesError.message }, { status: 400 });
    }

    exerciseLookup = new Map(
      (exercises ?? [])
        .filter((exercise): exercise is { id: string; name: string; exercise_type_label: string | null } =>
          Boolean(exercise?.id)
        )
        .map((exercise) => [exercise.id, exercise])
    );
  }

  const enriched = workoutExercises.map((we) => ({
    ...we,
    exercise: we.exercise_id ? exerciseLookup.get(we.exercise_id) ?? null : null,
  }));

  return NextResponse.json({ data: enriched }, { status: 200 });
}

export async function POST(req: Request, { params }: Params) {
  const { workoutId } = await params;
  const body = (await req.json()) as Partial<{
    exercise_id: string;
    exercise_source: string;
    notes: string;
  }>;
  const exerciseId = body.exercise_id?.trim();
  if (!exerciseId) {
    return NextResponse.json({ error: "Invalid exercise_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: exerciseMeta, error: metaError } = await supabase
    .from("available_exercises")
    .select("id, source, user_id")
    .eq("id", exerciseId)
    .maybeSingle();

  if (metaError) {
    return NextResponse.json({ error: metaError.message }, { status: 400 });
  }

  if (!exerciseMeta) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  if (exerciseMeta.source === "custom" && exerciseMeta.user_id && exerciseMeta.user_id !== user.id) {
    return NextResponse.json({ error: "Exercise not accessible" }, { status: 403 });
  }

  // ensure workout belongs to user
  const { data: w } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // compute next order_index
  const { data: maxRow } = await supabase
    .from("workout_exercises")
    .select("order_index")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id: workoutId,
      user_id: user.id,
      exercise_id: exerciseId,
      order_index: nextOrder,
      notes: body.notes,
    })
    .select("id, workout_id, exercise_id, order_index")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to insert workout exercise" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
