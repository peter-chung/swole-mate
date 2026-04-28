import NavBar from "@/app/_components/NavBar";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950">
      <NavBar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</main>
    </div>
  );
}
