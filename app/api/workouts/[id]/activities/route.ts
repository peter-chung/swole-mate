// app/api/workouts/[id]/activities/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ id: string }> };
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

  const { id: workoutId } = await params;

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

  // Fetch activities (workout_exercises) with nested exercise + sets
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      id, workout_id, exercise_id, order_index, notes,
      exercise:exercises ( id, name, type ),
      exercise_sets ( id, set_number, reps, weight, duration, distance, notes )
    `
    )
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true })
    .order("set_number", { ascending: true, foreignTable: "exercise_sets" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request, { params }: Params) {
  const { id: workout_id } = await params;
  const body = (await req.json()) as Partial<{
    exercise_id: number | string;
    notes: string;
  }>;
  const exerciseIdNum = Number(body.exercise_id);
  if (!Number.isFinite(exerciseIdNum)) {
    return NextResponse.json({ error: "Invalid exercise_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ensure workout belongs to user
  const { data: w } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workout_id)
    .eq("user_id", user.id)
    .single();
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // compute next order_index
  const { data: maxRow } = await supabase
    .from("workout_exercises")
    .select("order_index")
    .eq("workout_id", workout_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id,
      user_id: user.id,
      exercise_id: exerciseIdNum,
      order_index: nextOrder,
      notes: body.notes,
    })
    .select("id, workout_id, exercise_id, order_index")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
