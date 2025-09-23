import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const search = (searchParams.get("search") || "").trim();
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
  let query = supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    const term = search.replace(/,/g, ""); // avoid comma breaking the OR filter
    query = query.or(
      [
        `name.ilike.%${term}%`,
        `type.ilike.%${term}%`,
        `primary_muscle.ilike.%${term}%`,
        `other_muscles.ilike.%${term}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // keep the shape your page expects: { data: Exercise[] }
  return NextResponse.json(
    { data: (data ?? []) as Exercise[] },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = (await req.json()) as Partial<Exercise>;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: Partial<Exercise> & { user_id: string } = {
    ...body,
    user_id: user.id,
  };

  if (body.exercise_type_id && !body.type) {
    const { data: exerciseType, error: exerciseTypeError } = await supabase
      .from("exercise_types")
      .select("label")
      .eq("id", body.exercise_type_id)
      .single();

    if (exerciseTypeError) {
      return NextResponse.json(
        { error: exerciseTypeError.message },
        { status: 400 }
      );
    }

    if (exerciseType?.label) {
      payload.type = exerciseType.label;
    }
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert(payload)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
