import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

type AvailableExercise =
  Database["public"]["Views"]["available_exercises"]["Row"];
type CustomExerciseInsert =
  Database["public"]["Tables"]["custom_exercises"]["Insert"];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const search = (searchParams.get("search") || "").trim();
  const limitParam = Number(searchParams.get("limit"));
  const offsetParam = Number(searchParams.get("offset"));

  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 100)
    : 25;
  const offset = Number.isFinite(offsetParam)
    ? Math.max(Math.floor(offsetParam), 0)
    : 0;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("available_exercises")
    .select("*", { count: "exact" })
    .order("source", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    const term = search.replace(/,/g, ""); // avoid comma breaking the OR filter
    query = query.or(
      [
        `name.ilike.%${term}%`,
        `exercise_type_label.ilike.%${term}%`,
        `exercise_type_key.ilike.%${term}%`,
        `primary_muscle.ilike.%${term}%`,
        `other_muscles.ilike.%${term}%`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // keep the shape your page expects: { data: Exercise[] }
  return NextResponse.json(
    {
      data: (data ?? []) as AvailableExercise[],
      count: count ?? 0,
      limit,
      offset,
    },
    {
      status: 200,
    }
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = (await req.json()) as Partial<CustomExerciseInsert>;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!body.exercise_type_id) {
    return NextResponse.json(
      { error: "Exercise type is required." },
      { status: 400 }
    );
  }

  const payload: CustomExerciseInsert = {
    name: body.name.trim(),
    exercise_type_id: body.exercise_type_id,
    primary_muscle: body.primary_muscle?.trim() || null,
    other_muscles: body.other_muscles?.trim() || null,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("custom_exercises")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.id) {
    return NextResponse.json({ data }, { status: 201 });
  }

  const { data: viewRow, error: viewError } = await supabase
    .from("available_exercises")
    .select("*")
    .eq("id", data.id)
    .single();

  if (viewError) {
    return NextResponse.json({ data }, { status: 201 });
  }

  return NextResponse.json({ data: viewRow }, { status: 201 });
}
