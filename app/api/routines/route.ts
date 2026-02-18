import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const limit = Number(searchParams.get("limit") || 25);
  const offset = Number(searchParams.get("offset") || 0);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = supabase
    .from("routines")
    .select(
      `
      id, user_id, date, name, notes, started_at, ended_at, created_at,
      user:profiles ( id, username, full_name )
    `
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  const normalized = (data ?? []).map((row: any) => {
    const { user, ...rest } = row as any;
    const owner = Array.isArray(user) ? user[0] ?? null : user ?? null;
    return { ...rest, user: owner };
  });

  return NextResponse.json({ data: normalized }, { status: 200 });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = (await req.json()) as Partial<{
    name: string | null;
    notes: string | null;
    date: string | null;
  }>;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    user_id: user.id,
    name: body.name?.trim() || null,
    notes: body.notes?.trim() || null,
    date: body.date || new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabase
    .from("routines")
    .insert(payload)
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: (data as any).id }, { status: 201 });
}
