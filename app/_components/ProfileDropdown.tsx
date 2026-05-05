"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";

type Props = {
  email: string;
};

export default function ProfileDropdown({ email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Profile menu"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white transition duration-150"
      >
        <User size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-white">
              {email}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-800"
            >
              <User size={14} />
              My Profile
            </Link>
          </div>

          <div className="border-t border-gray-100 p-1 dark:border-neutral-800">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
