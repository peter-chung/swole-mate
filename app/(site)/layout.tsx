import NavBar from "@/app/_components/NavBar";
import BottomNav from "@/app/_components/BottomNav";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <NavBar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 pb-20 sm:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
