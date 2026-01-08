"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { prettyDate } from "@/utils/format";
import type { Tables } from "@/types/database.types";
import SaveAsRoutineButton from "./SaveAsRoutineButton";
import { copyWorkoutAction } from "../actions";

type Workout = Tables<"workouts">;
type Props = { workout: Workout; ownerName: string };

const WorkoutDetailCard = ({ workout, ownerName }: Props) => {
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
    <>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Workout Details
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/workouts/${workout.id}/edit`}
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
            <span>Edit workout</span>
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-gray-500/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
              <path d="M8 16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
            </svg>
            <span>{isPending ? "Copying..." : "Copy workout"}</span>
          </button>
          {/* Save as routine button (client component) */}
          <SaveAsRoutineButton
            workoutId={workout.id}
            defaultTitle={workout.name ?? ""}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {workout.name || "Untitled workout"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <span>{prettyDate(workout?.date)}</span>
              <span className="mx-2">•</span>
              <span>By {ownerName}</span>
            </p>
          </div>
        </div>
        {workout.notes && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {workout.notes}
          </p>
        )}
      </div>
    </>
  );
};

export default WorkoutDetailCard;
