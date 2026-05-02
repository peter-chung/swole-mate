import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ProfileDropdown from "./ProfileDropdown";
import { ButtonLink } from "@/app/_components/Button";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-20 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-neutral-800">
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
              href="/feed"
              className="hidden sm:inline text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Feed
            </Link>
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
              <ProfileDropdown email={user.email ?? ""} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition duration-150"
                >
                  Log in
                </Link>
                <ButtonLink href="/signup" variant="primary">
                  Sign up
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
