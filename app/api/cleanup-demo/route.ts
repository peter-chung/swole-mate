import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role needed to query and delete from auth.users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Delete anonymous users older than 24 hours — cascades to all their data
  const { error } = await supabase.auth.admin
    .listUsers({ perPage: 1000 })
    .then(async ({ data }) => {
      const stale = (data?.users ?? []).filter(
        (u) =>
          u.is_anonymous &&
          new Date(u.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000),
      );

      for (const u of stale) {
        await supabase.from("profiles").delete().eq("id", u.id);
        await supabase.auth.admin.deleteUser(u.id);
      }

      return { error: null };
    });

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ ok: true });
}
