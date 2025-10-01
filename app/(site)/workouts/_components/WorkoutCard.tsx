"use client";

import React from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";
import { prettyDate } from "@/utils/format";

type WorkoutRow = Tables<"workouts">;
type Workout = WorkoutRow & {
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
  } | null;
};

const WorkoutCard = ({ workout }: { workout: Workout }) => {
  const { name, date } = workout;
  const ownerName = workout.user?.username ?? workout.user?.full_name ?? null;

  return (
    <li className="h-full">
      <Link
        href={`/workouts/${workout.id}`}
        className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-gray-800 dark:bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 transition group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
              {name || "Untitled workout"}
            </h3>
            {date && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {prettyDate(date)}
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
    </li>
  );
};

export default WorkoutCard;
