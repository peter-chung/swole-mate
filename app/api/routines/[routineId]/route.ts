import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ routineId: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: Params) {
  const { routineId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("routines")
    .select(
      `
    id, user_id, date, name, notes, started_at, ended_at,
    user:profiles ( id, username, full_name ),
    routine_exercises (
      id, public_exercise_id, custom_exercise_id, equipment_brand, order_index, notes,
      routine_sets ( id, set_number, reps, weight, duration, distance, notes )
    )
  `
    )
    .eq("id", routineId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const routineExercises = ((data as any)?.routine_exercises ?? [])
    .slice()
    .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const resolveExerciseId = (re: any) =>
    re.public_exercise_id ?? re.custom_exercise_id ?? null;

  const exerciseIds = Array.from(
    new Set(
      routineExercises
        .map((re: any) => resolveExerciseId(re))
        .filter((id: any): id is string => Boolean(id))
    )
  );

  type ExerciseLookupEntry = {
    id: string;
    name: string;
    exercise_type_label: string | null;
    has_weight: boolean | null;
    has_reps: boolean | null;
    has_duration: boolean | null;
    has_distance: boolean | null;
    is_bodyweight: boolean | null;
    is_assisted: boolean | null;
    primary_muscle: string | null;
  };

  let exerciseLookup = new Map<string, ExerciseLookupEntry>();

  if (exerciseIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("available_exercises")
      .select("id, name, exercise_type_label, has_weight, has_reps, has_duration, has_distance, is_bodyweight, primary_muscle")
      .in("id", exerciseIds);

    if (exercisesError) {
      return NextResponse.json(
        { error: exercisesError.message },
        { status: 500 }
      );
    }

    exerciseLookup = new Map(
      (exercises ?? [])
        .filter((e): e is ExerciseLookupEntry => Boolean(e?.id))
        .map((e) => [e.id, e])
    );
  }

  const enriched = {
    ...(data as any),
    routine_exercises: routineExercises.map((re: any) => {
      const exerciseId = resolveExerciseId(re);
      return {
        ...re,
        exercise: exerciseId ? exerciseLookup.get(exerciseId) ?? null : null,
      };
    }),
  };

  return NextResponse.json({ data: enriched }, { status: 200 });
}

export async function PATCH(req: Request, { params }: Params) {
  const { routineId } = await params;
  const payload = (await req.json()) as Partial<{
    name: string;
    date: string;
    notes: string;
    ended_at: string | null;
  }>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates: any = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.date !== undefined && { date: payload.date }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
    ...(payload.ended_at !== undefined && { ended_at: payload.ended_at }),
  };

  const hasUpdates = Object.keys(updates).length > 0;

  if (!hasUpdates) {
    const { data: existing, error: existingError } = await supabase
      .from("routines")
      .select("id, name, date, notes, ended_at")
      .eq("id", routineId)
      .eq("user_id", user.id)
      .single();

    if (existingError)
      return NextResponse.json(
        { error: existingError.message },
        { status: 400 }
      );

    return NextResponse.json(existing, { status: 200 });
  }

  const { data, error } = await supabase
    .from("routines")
    .update(updates)
    .eq("id", routineId)
    .eq("user_id", user.id)
    .select("id, name, date, notes, ended_at")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { routineId } = await params;

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 200 });
}
