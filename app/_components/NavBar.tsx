import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ProfileDropdown from "./ProfileDropdown";
import { ButtonLink } from "@/app/_components/Button";
import NavLinks from "./NavLinks";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAnonymous = user?.is_anonymous ?? false;

  return (
    <header className="sticky top-[env(safe-area-inset-top)] z-20 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-neutral-800">
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
            {user && <NavLinks />}
            {user && isAnonymous ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 transition hover:text-gray-300 dark:text-gray-400 dark:hover:text-white"
                >
                  Exit Demo
                </button>
              </form>
            ) : user ? (
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
