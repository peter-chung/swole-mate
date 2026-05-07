"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/workouts", label: "Workouts" },
  { href: "/routines", label: "Routines" },
  { href: "/exercises", label: "Exercises" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`hidden sm:inline transition-colors ${
              active
                ? "text-[#3ecf8e]"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
