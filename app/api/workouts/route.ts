import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];
type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];
type WorkoutWithOwner = Workout & {
  user: {
    id: string;
    username: string | null;
    full_name: string | null;
  } | null;
  exerciseCount: number;
  exerciseNames: string[];
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  // const search = (searchParams.get("search") || "").trim();
  const limit = Number(searchParams.get("limit") || 25);
  const offset = Number(searchParams.get("offset") || 0);

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      id, user_id, date, name, notes, created_at,
      user:profiles ( id, username, full_name ),
      workout_exercises ( id, public_exercise_id, custom_exercise_id, order_index )
    `
    )
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  type UserSummary = { id: string; username: string | null; full_name: string | null };

  const allExerciseIds = Array.from(
    new Set(
      (data ?? []).flatMap((w: any) =>
        (w.workout_exercises ?? [])
          .map((we: any) => we.public_exercise_id ?? we.custom_exercise_id ?? null)
          .filter(Boolean)
      )
    )
  ) as string[];

  const exerciseNameMap = new Map<string, string>();
  if (allExerciseIds.length > 0) {
    const { data: exercises } = await supabase
      .from("available_exercises")
      .select("id, name")
      .in("id", allExerciseIds);
    for (const ex of exercises ?? []) {
      if (ex.id && ex.name) exerciseNameMap.set(ex.id, ex.name);
    }
  }

  const normalized: WorkoutWithOwner[] = (data ?? []).map((row: any) => {
    const { user, workout_exercises: rawExercises, ...rest } = row as Workout & {
      user?: UserSummary | UserSummary[] | null;
      workout_exercises?: any[];
    };
    const owner = Array.isArray(user) ? user[0] ?? null : user ?? null;
    const exercises: any[] = Array.isArray(rawExercises) ? rawExercises : [];
    const ordered = exercises.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const exerciseNames = ordered
      .map((we) => {
        const id = we.public_exercise_id ?? we.custom_exercise_id ?? null;
        return id ? (exerciseNameMap.get(id) ?? null) : null;
      })
      .filter((n): n is string => n !== null);

    return { ...rest, user: owner, exerciseCount: exercises.length, exerciseNames };
  });

  return NextResponse.json({ data: normalized }, { status: 200 });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = (await req.json()) as Partial<WorkoutInsert>;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: WorkoutInsert = {
    user_id: user.id,
    name: body.name?.trim() || null,
    notes: body.notes?.trim() || null,
    date: body.date || new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabase
    .from("workouts")
    .insert(payload)
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
