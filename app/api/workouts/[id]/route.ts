import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// type RouteContext = {
//   params: Promise<{ id: string }>;
// };

type Params = { params: Promise<{ id: string }> };

// Fetch workout
// export async function GET(req: Request, { params }: Params) {
//   const { id } = await params;
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
//     .eq("id", id)
//     .single();

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
//   return NextResponse.json({ data }, { status: 200 });
// }
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
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
    id, user_id, date, name, notes, status, started_at, ended_at,
    user:users ( id, username, full_name ),
    workout_exercises (
      id, exercise_id, order_index, notes,
      exercise_sets ( id, set_number, reps, weight, duration, distance, notes )
    )
  `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workoutExercises = data?.workout_exercises ?? [];
  const exerciseIds = Array.from(
    new Set(
      workoutExercises
        .map((we) => we.exercise_id)
        .filter((exerciseId): exerciseId is string => Boolean(exerciseId))
    )
  );

  let exerciseLookup = new Map<
    string,
    { id: string; name: string; exercise_type_label: string | null }
  >();

  if (exerciseIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("available_exercises")
      .select("id, name, exercise_type_label")
      .in("id", exerciseIds);

    if (exercisesError) {
      return NextResponse.json(
        { error: exercisesError.message },
        { status: 500 }
      );
    }

    exerciseLookup = new Map(
      (exercises ?? [])
        .filter(
          (
            exercise
          ): exercise is {
            id: string;
            name: string;
            exercise_type_label: string | null;
          } => Boolean(exercise?.id)
        )
        .map((exercise) => [exercise.id, exercise])
    );
  }

  const enriched = {
    ...data,
    workout_exercises: workoutExercises.map((we) => ({
      ...we,
      exercise: we.exercise_id
        ? exerciseLookup.get(we.exercise_id) ?? null
        : null,
    })),
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

//     const { id } = await params;

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
  const { id } = await params;
  const payload = (await req.json()) as Partial<{
    name: string;
    status: "draft" | "complete";
    date: string; // YYYY-MM-DD from <input type="date">
    notes: string;
    ended_at: string | null;
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
    ...(payload.status !== undefined && { status: payload.status }),
    ...(payload.date !== undefined && { date: payload.date }),
    ...(payload.notes !== undefined && { notes: payload.notes }),
    ...(payload.ended_at !== undefined && { ended_at: payload.ended_at }),
  };

  const { data, error } = await supabase
    .from("workouts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, status, date, notes, ended_at")
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

  const { id } = await params;

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
