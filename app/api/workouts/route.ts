import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];
type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  // const search = (searchParams.get("search") || "").trim();
  const limit = Number(searchParams.get("limit") || 25);
  const offset = Number(searchParams.get("offset") || 0);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // base query
  const query = supabase
    .from("workouts")
    .select("*")
    .order("name", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // keep the shape your page expects: { data: Workout[] }
  return NextResponse.json(
    { data: (data ?? []) as Workout[] },
    { status: 200 }
  );
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
    status: "draft",
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
