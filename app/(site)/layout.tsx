import NavBar from "@/app/_components/NavBar";
import BottomNav from "@/app/_components/BottomNav";
import DemoBanner from "@/app/_components/DemoBanner";
import TryDemoBanner from "@/app/_components/TryDemoBanner";
import { createClient } from "@/utils/supabase/server";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <NavBar />
      <DemoBanner />
      <TryDemoBanner />
      <main className={`flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 ${user ? "pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0" : ""}`}>
        {children}
      </main>
      {user && <BottomNav />}
    </div>
  );
}
