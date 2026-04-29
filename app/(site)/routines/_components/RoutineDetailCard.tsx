"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Pencil, Play } from "lucide-react";
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
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {routine.name || "Untitled routine"}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/routines/${routine.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-600 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-gray-400/40"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span>Edit</span>
          </Link>
          <button
            type="button"
            onClick={handleStartWorkout}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-green-500/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>{isPending ? "Starting..." : "Start Workout"}</span>
          </button>
        </div>
      </div>
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
  );
}
