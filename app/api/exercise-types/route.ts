import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Tables } from "@/types/database.types";

type ExerciseType = Tables<"exercise_types">;

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("exercise_types")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: (data ?? []) as ExerciseType[] },
    { status: 200 }
  );
}
