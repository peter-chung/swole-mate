// app/api/workouts/[id]/activities/[activityId]/sets/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ id: string; activityId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id: workout_id, activityId: workout_exercise_id } = await params;
  const body = (await req.json()) as Partial<{
    set_number: number;
    reps: number | null;
    weight: number | null;
    duration: string | null;
    distance: number | null;
    notes: string | null;
  }>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ownership check by joining back to workout
  const { data: we } = await supabase
    .from("workout_exercises")
    .select("id, workout_id, workout:workouts!inner(user_id)")
    .eq("id", workout_exercise_id)
    .single();

  if (
    !we ||
    (we as any).workout.user_id !== user.id ||
    we.workout_id !== workout_id
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // auto set_number if not provided
  let set_number = body.set_number;
  if (!set_number) {
    const { data: maxSet } = await supabase
      .from("exercise_sets")
      .select("set_number")
      .eq("workout_exercise_id", workout_exercise_id)
      .order("set_number", { ascending: false })
      .limit(1)
      .single();
    set_number = (maxSet?.set_number ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      workout_exercise_id,
      set_number,
      reps: body.reps ?? null,
      weight: body.weight ?? null,
      duration: body.duration ?? null,
      distance: body.distance ?? null,
      notes: body.notes ?? null,
    })
    .select("id, set_number, reps, weight, duration, distance, notes")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
