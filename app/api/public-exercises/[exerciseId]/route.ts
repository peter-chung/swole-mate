import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type RouteContext = { params: Promise<{ exerciseId: string }> };
type PublicExerciseUpdate =
  Database["public"]["Tables"]["public_exercises"]["Update"];

export const dynamic = "force-dynamic";

function isAdmin(email?: string | null) {
  return !!email && email === process.env.ADMIN_EMAIL;
}

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { exerciseId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await serviceClient()
    .from("public_exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { exerciseId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<PublicExerciseUpdate>;
  const updatePayload: PublicExerciseUpdate = {};

  if (body.name !== undefined) {
    const trimmed = body.name?.trim() ?? "";
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updatePayload.name = trimmed;
  }
  if (body.primary_muscle !== undefined) {
    updatePayload.primary_muscle = body.primary_muscle?.trim() || null;
  }
  if (body.other_muscles !== undefined) {
    updatePayload.other_muscles = body.other_muscles?.trim() || null;
  }
  if (body.exercise_type_id !== undefined) {
    updatePayload.exercise_type_id = body.exercise_type_id;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields provided for update." }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from("public_exercises")
    .update(updatePayload)
    .eq("id", exerciseId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { exerciseId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await serviceClient()
    .from("public_exercises")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
