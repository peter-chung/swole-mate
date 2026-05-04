"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Repeat, Library, Rss } from "lucide-react";

const links = [
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/routines", label: "Routines", icon: Repeat },
  { href: "/exercises", label: "Exercises", icon: Library },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
      <ul className="flex h-16 items-stretch">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-[#3ecf8e]"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
