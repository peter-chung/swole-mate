import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Zap } from "lucide-react";

export default async function DemoBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.is_anonymous) return null;

  return (
    <div className="border-b border-amber-800/40 bg-amber-950/50 px-4 py-2.5">
      <p className="text-center text-sm text-amber-300">
        <Zap size={13} className="mr-1 inline-block align-middle" />
        You&apos;re in demo mode. Your data won&apos;t be saved.{" "}
        <Link
          href="/signup"
          className="font-semibold text-amber-200 underline decoration-amber-400/50 underline-offset-2 hover:no-underline"
        >
          Sign up to keep your progress →
        </Link>
      </p>
    </div>
  );
}
