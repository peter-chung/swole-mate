"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Tables } from "@/types/database.types";
import EditWorkoutForm from "../../_components/EditWorkoutForm";
import LoadingSpinner from "@/app/_components/LoadingSpinner";

type WorkoutRow = Tables<"workouts">;
type Workout = WorkoutRow;

const EditWorkoutPage = () => {
  const params = useParams();
  const workoutId = params.id as string;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchWorkout = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!workoutId) return;
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        const res = await fetch(`/api/workouts/${encodeURIComponent(workoutId)}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setWorkout(result.data as Workout);
      } catch (err) {
        console.error("Error fetching workout:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [workoutId]
  );

  useEffect(() => {
    void fetchWorkout();
  }, [fetchWorkout]);
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={workout ? `/workouts/${workout.id}` : "/workouts"}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to workout</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Workout
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {workout?.name ? (
            <span className="truncate">{workout.name}</span>
          ) : (
            workout?.date && <span className="truncate">{workout.date}</span>
          )}
          {workout?.status && (
            <span className="inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {workout.status}
            </span>
          )}
        </div>
      </header>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : (
        <>
          <section className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
            <EditWorkoutForm workout={workout} />
          </section>

          <section className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white/40 p-4 text-sm dark:border-gray-700 dark:bg-gray-900/30 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-gray-700 dark:text-gray-300">
                Need to adjust exercises or sets for this workout?
              </div>
              <Link
                href={`/workouts/${workoutId}/exercises/edit`}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px"
              >
                Manage Exercises
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default EditWorkoutPage;
