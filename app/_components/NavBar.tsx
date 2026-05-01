import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { User } from "lucide-react";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-20 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              💪
            </span>
            <span>SwoleMate</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link
              href="/workouts"
              className="hidden sm:inline text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Workouts
            </Link>
            <Link
              href="/routines"
              className="hidden sm:inline text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Routines
            </Link>
            <Link
              href="/exercises"
              className="hidden sm:inline text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Exercises
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-full w-8 h-8 border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-900/40"
                aria-label="Profile"
              >
                <User size={15} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition duration-150"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow hover:bg-gray-800 hover:opacity-90 active:translate-y-px transition duration-150 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
