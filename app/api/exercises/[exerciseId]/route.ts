import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database.types";

type RouteContext = {
  params: { exerciseId: string };
};
type CustomExerciseUpdate =
  Database["public"]["Tables"]["custom_exercises"]["Update"];

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const { exerciseId } = params;

  const { data, error } = await supabase
    .from("available_exercises")
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

    const body = (await req.json()) as Partial<
      CustomExerciseUpdate & {
        exercise_type_label?: string;
        exercise_type_key?: string;
        source?: string;
        type?: string;
      }
    >;

    const { exerciseId } = params;

    const updatePayload: CustomExerciseUpdate = {};

    if (body.name !== undefined) {
      const trimmed = body.name?.trim() ?? "";
      if (!trimmed) {
        return NextResponse.json(
          { error: "Name cannot be empty." },
          { status: 400 }
        );
      }
      updatePayload.name = trimmed;
    }
    if (body.primary_muscle !== undefined) {
      const value = body.primary_muscle?.trim();
      updatePayload.primary_muscle = value ? value : null;
    }
    if (body.other_muscles !== undefined) {
      const value = body.other_muscles?.trim();
      updatePayload.other_muscles = value ? value : null;
    }
    if (body.exercise_type_id !== undefined) {
      updatePayload.exercise_type_id = body.exercise_type_id;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("custom_exercises")
      .update(updatePayload)
      .eq("id", exerciseId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.id) {
      return NextResponse.json({ data }, { status: 200 });
    }

    const { data: viewRow, error: viewError } = await supabase
      .from("available_exercises")
      .select("*")
      .eq("id", data.id)
      .single();

    if (viewError) {
      return NextResponse.json({ data }, { status: 200 });
    }

    return NextResponse.json({ data: viewRow }, { status: 200 });
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

  const { exerciseId } = params;

  const { error } = await supabase
    .from("custom_exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
