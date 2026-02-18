"use client";

import React from "react";
import Link from "next/link";
import { prettyDate } from "@/utils/format";
import type { Tables } from "@/types/database.types";

type RoutineRow = Tables<"routines">;
type Routine = RoutineRow & {
  user?: {
    id: string;
    username?: string | null;
    full_name?: string | null;
  } | null;
};

export default function RoutineCard({ routine }: { routine: Routine }) {
  const ownerName = routine.user?.username ?? routine.user?.full_name ?? null;

  return (
    <li className="h-full">
      <div className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/60 dark:border-gray-800 dark:bg-neutral-900">
        <Link
          href={`/routines/${routine.id}`}
          className="block flex-1 focus-visible:outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 transition group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
                {routine.name || "Untitled routine"}
              </h3>
              {routine.date && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {prettyDate(routine.date)}
                </p>
              )}
              {ownerName && (
                <p className="mt-1 text-xs text-gray-500 transition group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-300">
                  By {ownerName}
                </p>
              )}
            </div>
            <span className="inline-flex items-center text-xs font-medium text-gray-500 transition group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-300">
              View →
            </span>
          </div>
        </Link>

        <div className="mt-3" />
      </div>
    </li>
  );
}
