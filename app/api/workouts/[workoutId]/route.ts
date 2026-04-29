import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ workoutId: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fetch workout
// export async function GET(req: Request, { params }: Params) {
//   const { workoutId } = await params;
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const { data, error } = await supabase
//     .from("workouts")
//     .select("*")
//     .eq("id", workoutId)
//     .single();

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
//   return NextResponse.json({ data }, { status: 200 });
// }
export async function GET(req: Request, { params }: Params) {
  const { workoutId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
    id, user_id, date, name, notes,
    user:profiles ( id, username, full_name ),
    workout_exercises (
      id, public_exercise_id, custom_exercise_id, equipment_brand, order_index, notes,
      exercise_sets ( id, set_number, reps, weight, duration, distance, notes )
    )
  `
    )
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workoutExercises = data?.workout_exercises ?? [];
  const resolveExerciseId = (we: {
    public_exercise_id?: string | null;
    custom_exercise_id?: string | null;
  }) => we.public_exercise_id ?? we.custom_exercise_id ?? null;

  const exerciseIds = Array.from(
    new Set(
      workoutExercises
        .map((we) => resolveExerciseId(we))
        .filter((exerciseId): exerciseId is string => Boolean(exerciseId))
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
        .filter((exercise): exercise is ExerciseLookupEntry => Boolean(exercise?.id))
        .map((exercise) => [exercise.id, exercise])
    );
  }

  const enriched = {
    ...data,
    workout_exercises: workoutExercises.map((we) => {
      const exerciseId = resolveExerciseId(we);
      return {
        ...we,
        exercise: exerciseId ? exerciseLookup.get(exerciseId) ?? null : null,
      };
    }),
  };

  return NextResponse.json({ data: enriched }, { status: 200 });
}

// Update workout
// export async function PATCH(req: Request, { params }: Params) {
//   try {
//     const supabase = await createClient();

//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();

//     const { workoutId } = await params;

//     const { data, error } = await supabase
//       .from("workouts")
//       .update(body)
//       .eq("id", id)
//       .eq("user_id", user.id)
//       .select()
//       .single();

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     return NextResponse.json({ data }, { status: 200 });
//   } catch (err) {
//     console.error("PATCH /workouts/[id] error:", err);

//     if (err instanceof Error) {
//       return NextResponse.json({ error: err.message }, { status: 500 });
//     }

//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

export async function PATCH(req: Request, { params }: Params) {
  const { workoutId } = await params;
  const payload = (await req.json()) as Partial<{
    name: string;
    date: string; // YYYY-MM-DD from <input type="date">
    notes: string;
  }>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Build whitelist of fields to update
  const updates = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.date !== undefined && { date: payload.date }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
  };

  const hasUpdates = Object.keys(updates).length > 0;

  if (!hasUpdates) {
    const { data: existing, error: existingError } = await supabase
      .from("workouts")
      .select("id, name, date, notes")
      .eq("id", workoutId)
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
    .from("workouts")
    .update(updates)
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .select("id, name, date, notes")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// Delete workout
export async function DELETE(req: Request, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workoutId } = await params;

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
