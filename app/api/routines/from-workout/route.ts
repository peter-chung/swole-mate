import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resolveExerciseForUser } from "@/app/_lib/resolveExercise";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = (await req.json()) as {
      workoutId: string;
      title?: string | null;
      is_public?: boolean;
    };

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workoutId, title } = body;

    // fetch workout with nested exercises and sets — allow any visible workout, not just own
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .select(
        `id, user_id, date, name, notes,
        workout_exercises ( id, public_exercise_id, custom_exercise_id, user_id, equipment_brand, order_index, notes,
          custom_exercise:custom_exercises ( name, exercise_type_id, primary_muscle, other_muscles ),
          exercise_sets ( id, set_number, reps, weight, duration, distance, notes )
        )`
      )
      .eq("id", workoutId)
      .maybeSingle();

    if (workoutError)
      return NextResponse.json(
        { error: workoutError.message },
        { status: 400 }
      );

    if (!workoutData)
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });

    const workout = workoutData as any;

    const routinePayload = {
      user_id: user.id,
      name: title?.trim() ?? workout?.name ?? null,
      notes: workout?.notes ?? null,
      date: workout?.date || new Date().toISOString().slice(0, 10),
    };

    const { data: createdRoutine, error: createError } = await supabase
      .from("routines")
      .insert(routinePayload)
      .select("id")
      .single();

    if (createError)
      return NextResponse.json({ error: createError.message }, { status: 500 });

    const routineId = (createdRoutine as any).id;

    const exercises = (workout as any)?.workout_exercises ?? [];
    let skippedExercises = 0;
    let duplicatedAsCustom = 0;

    // helper to cleanup partial state if something fails mid-copy
    async function cleanupRoutine(routineIdToClean: string) {
      try {
        const { data: insertedExercises } = await supabase
          .from("routine_exercises")
          .select("id")
          .eq("routine_id", routineIdToClean);

        const exerciseIds = (insertedExercises ?? []).map((r: any) => r.id);

        if (exerciseIds.length > 0) {
          await supabase
            .from("routine_sets")
            .delete()
            .in("routine_exercise_id", exerciseIds);
          await supabase
            .from("routine_exercises")
            .delete()
            .eq("routine_id", routineIdToClean);
        }

        await supabase.from("routines").delete().eq("id", routineIdToClean);
      } catch (cleanupErr) {
        console.error("cleanupRoutine error:", cleanupErr);
      }
    }

    for (const ex of exercises) {
      const result = await resolveExerciseForUser(supabase, user.id, {
        public_exercise_id: ex.public_exercise_id ?? null,
        custom_exercise_id: ex.custom_exercise_id ?? null,
        user_id: ex.user_id ?? null,
        custom_exercise: ex.custom_exercise ?? null,
      });

      if (!result) {
        skippedExercises += 1;
        continue;
      }

      if (result.duplicated) duplicatedAsCustom += 1;

      const { data: createdRoutineExercise, error: reError } = await supabase
        .from("routine_exercises")
        .insert({
          public_exercise_id: result.resolved.public_exercise_id,
          custom_exercise_id: result.resolved.custom_exercise_id,
          equipment_brand: ex.equipment_brand ?? null,
          order_index: ex.order_index ?? null,
          notes: ex.notes ?? null,
          user_id: user.id,
          routine_id: routineId,
        })
        .select("id")
        .single();

      if (reError) {
        await cleanupRoutine(routineId);
        return NextResponse.json({ error: reError.message }, { status: 500 });
      }

      const routineExerciseId = (createdRoutineExercise as any).id;

      const sets = ex.exercise_sets ?? [];
      for (const s of sets) {
        const { error: setError } = await supabase.from("routine_sets").insert({
          set_number: s.set_number,
          reps: s.reps ?? null,
          weight: s.weight ?? null,
          duration: s.duration ?? null,
          distance: s.distance ?? null,
          notes: s.notes ?? null,
          user_id: user.id,
          routine_exercise_id: routineExerciseId,
        });

        if (setError) {
          await cleanupRoutine(routineId);
          return NextResponse.json({ error: setError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ id: routineId, skippedExercises, duplicatedAsCustom }, { status: 201 });
  } catch (err) {
    if (err instanceof Error)
      return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
