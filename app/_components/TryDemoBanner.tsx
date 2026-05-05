import { Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import DemoBannerLink from "./DemoBannerLink";

export default async function TryDemoBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) return null;

  return (
    <div className="border-b border-[#3ecf8e]/30 bg-[#3ecf8e]/10 px-4 py-2.5">
      <p className="text-center text-sm text-[#3ecf8e]">
        <Zap size={13} className="mr-1 inline-block align-middle" />
        Just exploring? Try SwoleMate without creating an account.{" "}
        <DemoBannerLink />
      </p>
    </div>
  );
}
