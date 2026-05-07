import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type PublicExerciseInsert =
  Database["public"]["Tables"]["public_exercises"]["Insert"];

export const dynamic = "force-dynamic";

function isAdmin(email?: string | null) {
  return !!email && email === process.env.ADMIN_EMAIL;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<PublicExerciseInsert>;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!body.exercise_type_id) {
    return NextResponse.json(
      { error: "Exercise type is required." },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const payload: PublicExerciseInsert = {
    name: body.name.trim(),
    exercise_type_id: body.exercise_type_id,
    primary_muscle: body.primary_muscle?.trim() || null,
    other_muscles: Array.isArray(body.other_muscles) && body.other_muscles.length > 0 ? body.other_muscles : null,
  };

  const { data, error } = await serviceClient
    .from("public_exercises")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
