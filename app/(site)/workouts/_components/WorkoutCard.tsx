"use client";

import React from "react";
import Link from "next/link";
import { prettyDate } from "@/utils/format";
import type { WorkoutWithOwner } from "../_lib/getWorkoutsList";

const PREVIEW_LIMIT = 3;

const WorkoutCard = ({ workout }: { workout: WorkoutWithOwner }) => {
  const { name, date, exerciseCount, exerciseNames } = workout;
  const ownerName = workout.user?.username ?? workout.user?.full_name ?? null;
  const preview = exerciseNames.slice(0, PREVIEW_LIMIT).join(", ");
  const overflow = exerciseCount - PREVIEW_LIMIT;

  return (
    <li className="h-full">
      <Link
        href={`/workouts/${workout.id}`}
        className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-gray-800 dark:bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 transition group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
              {name || "Untitled workout"}
            </h3>
            {date && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {prettyDate(date)}
              </p>
            )}
            {ownerName && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                By {ownerName}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-400 transition group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-300">
            View →
          </span>
        </div>

        {exerciseCount > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
            </p>
            {preview && (
              <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                {preview}{overflow > 0 ? ` +${overflow} more` : ""}
              </p>
            )}
          </div>
        )}
      </Link>
    </li>
  );
};

export default WorkoutCard;
