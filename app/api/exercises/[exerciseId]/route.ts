import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

type RouteContext = {
  params: Promise<{ exerciseId: string }>;
};

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

// Fetch exercise
export async function GET(req: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
}

// Update exercise
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<Exercise>;

    const payload = { ...body } as Partial<Exercise>;

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

    const { exerciseId } = await params;

    const { data, error } = await supabase
      .from("exercises")
      .update(payload) // update only the changed fields
      .eq("id", exerciseId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("PATCH /exercises/[id] error:", err);

    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // fallback if it's not an Error object
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Delete exercise
export async function DELETE(req: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
