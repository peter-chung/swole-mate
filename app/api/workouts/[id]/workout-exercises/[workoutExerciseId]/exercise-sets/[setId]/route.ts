import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = {
  params: Promise<{ id: string; workoutExerciseId: string; setId: string }>;
};

// Helper to verify ownership and relationships
async function assertOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workoutId: string,
  workoutExerciseId: number
) {
  const { data: we } = await supabase
    .from("workout_exercises")
    .select("id, workout_id, workout:workouts!inner(user_id)")
    .eq("id", workoutExerciseId)
    .single();

  if (!we || (we as any).workout.user_id !== userId || we.workout_id !== workoutId) {
    return false;
  }
  return true;
}

// Create a new exercise set (use setId="new")
export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workoutId, workoutExerciseId, setId } = await params;
  if (setId !== "new")
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const workoutExerciseIdNum = Number(workoutExerciseId);
  if (!Number.isFinite(workoutExerciseIdNum))
    return NextResponse.json({ error: "Invalid workoutExerciseId" }, { status: 400 });

  const owns = await assertOwnership(supabase, user.id, workoutId, workoutExerciseIdNum);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as Partial<{
    reps: number | null;
    weight: number | null;
    duration: string | null;
    distance: number | null;
    notes: string | null;
  }>;

  // compute next set_number
  const { data: maxSet } = await supabase
    .from("exercise_sets")
    .select("set_number")
    .eq("workout_exercise_id", workoutExerciseIdNum)
    .order("set_number", { ascending: false })
    .limit(1)
    .single();
  const nextSetNumber = (maxSet?.set_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      workout_exercise_id: workoutExerciseIdNum,
      user_id: user.id,
      set_number: nextSetNumber,
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

// Update an existing exercise set
export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workoutId, workoutExerciseId, setId } = await params;
  const workoutExerciseIdNum = Number(workoutExerciseId);
  const setIdNum = Number(setId);
  if (!Number.isFinite(workoutExerciseIdNum) || !Number.isFinite(setIdNum))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const owns = await assertOwnership(supabase, user.id, workoutId, workoutExerciseIdNum);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payload = (await req.json()) as Partial<{
    reps: number | null;
    weight: number | null;
    duration: string | null;
    distance: number | null;
    notes: string | null;
  }>;

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
    .eq("id", setIdNum)
    .eq("workout_exercise_id", workoutExerciseIdNum)
    .select("id, set_number, reps, weight, duration, distance, notes")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 200 });
}

// Delete an existing exercise set
export async function DELETE(req: Request, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workoutId, workoutExerciseId, setId } = await params;
  const workoutExerciseIdNum = Number(workoutExerciseId);
  const setIdNum = Number(setId);
  if (!Number.isFinite(workoutExerciseIdNum) || !Number.isFinite(setIdNum))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const owns = await assertOwnership(supabase, user.id, workoutId, workoutExerciseIdNum);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("exercise_sets")
    .delete()
    .eq("id", setIdNum)
    .eq("workout_exercise_id", workoutExerciseIdNum);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true }, { status: 200 });
}
