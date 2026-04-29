"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { prettyDate } from "@/utils/format";
import type { RoutineWithRelations } from "../_lib/getRoutine";
import { startWorkoutFromRoutineAction } from "../actions";

type Props = { routine: RoutineWithRelations; ownerName: string };

export default function RoutineDetailCard({ routine, ownerName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStartWorkout = () => {
    startTransition(async () => {
      try {
        const result = await startWorkoutFromRoutineAction(routine.id);
        if (result?.skippedExercises && result.skippedExercises > 0) {
          console.info(
            `Skipped ${result.skippedExercises} exercise(s) that could not be added.`
          );
        }

        if (result?.id) {
          router.push(`/workouts/${result.id}/edit`);
        }
      } catch (error) {
        console.error("Error starting workout from routine:", error);
      }
    });
  };
  return (
    <>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Routine Details
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/routines/${routine.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M16.862 4.487a2.25 2.25 0 0 1 3.182 3.182l-9.21 9.21a6.75 6.75 0 0 1-2.83 1.68l-2.492.71a.75.75 0 0 1-.92-.92l.71-2.492a6.75 6.75 0 0 1 1.68-2.83z" />
              <path d="m15 6 3 3" />
            </svg>
            <span>Edit routine</span>
          </Link>
          <button
            type="button"
            onClick={handleStartWorkout}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-green-500/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span>{isPending ? "Starting..." : "Start Workout"}</span>
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {routine.name || "Untitled routine"}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          <span>{prettyDate(routine?.date)}</span>
          <span className="mx-2">•</span>
          <span>By {ownerName}</span>
        </p>
        {routine.notes && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {routine.notes}
          </p>
        )}
      </div>
    </>
  );
}
