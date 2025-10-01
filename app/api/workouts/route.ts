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
};

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
    .select(
      `
      id, user_id, date, name, notes, status, started_at, ended_at, created_at,
      user:users ( id, username, full_name )
    `
    )
    .order("name", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  type UserSummary = {
    id: string;
    username: string | null;
    full_name: string | null;
  };

  const normalized: WorkoutWithOwner[] = (data ?? []).map((row) => {
    const { user, ...rest } = row as Workout & {
      user?: UserSummary | UserSummary[] | null;
    };
    const owner = Array.isArray(user) ? user[0] ?? null : user ?? null;
    return {
      ...rest,
      user: owner,
    };
  });

  // keep the shape your page expects: { data: Workout[] }
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
