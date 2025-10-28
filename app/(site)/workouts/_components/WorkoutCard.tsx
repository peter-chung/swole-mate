"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";
import { prettyDate } from "@/utils/format";
import { copyWorkoutAction } from "../actions";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    startTransition(async () => {
      try {
        const result = await copyWorkoutAction(workout.id);
        if (result?.skippedExercises && result.skippedExercises > 0) {
          console.info(
            `Skipped ${result.skippedExercises} exercise(s) that could not be copied.`
          );
        }

        if (result?.id) {
          router.push(`/workouts/${result.id}/edit`);
        }
      } catch (error) {
        console.error("Error copying workout:", error);
      }
    });
  };

  return (
    <li className="h-full">
      <div className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/60 dark:border-gray-800 dark:bg-neutral-900">
        <Link
          href={`/workouts/${workout.id}`}
          className="block flex-1 focus-visible:outline-none"
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

        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isPending}
            className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            {isPending ? "Copying..." : "Copy workout"}
          </button>
        </div>
      </div>
    </li>
  );
};

export default WorkoutCard;
