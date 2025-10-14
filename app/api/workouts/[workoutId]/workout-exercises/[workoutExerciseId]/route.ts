import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = {
  params: Promise<{ workoutId: string; workoutExerciseId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(req: Request, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workoutId, workoutExerciseId } = await params;
  const workoutExerciseIdNum = Number(workoutExerciseId);
  if (!Number.isFinite(workoutExerciseIdNum)) {
    return NextResponse.json(
      { error: "Invalid workout exercise id" },
      { status: 400 }
    );
  }

  // Constrain deletion by id, workout_id, and user_id for safety.
  const { data, error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", workoutExerciseIdNum)
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
