"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Tables } from "@/types/database.types";
import WorkoutDetailCard from "../_components/WorkoutDetailCard";
import ExerciseContainer from "../_components/ExerciseContainer";

type WorkoutRow = Tables<"workouts">;
type WorkoutDto = WorkoutRow & {
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
  } | null;
  workout_exercises?: Array<{
    id: string;
    order_index: number | null;
    notes: string | null;
    exercise: { id: string; name: string; type: string | null } | null;
    exercise_sets: Array<{
      id: string;
      set_number: number | null;
      reps: number | null;
      weight: number | null;
      duration: number | null;
      distance: number | null;
      notes: string | null;
    }>;
  }>;
};

export default function Page() {
  const { id: workoutId } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutDto | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchWorkout() {
    try {
      setLoading(true);
      const res = await fetch(`/api/workouts/${workoutId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setWorkout(result.data as WorkoutDto);
    } catch (error) {
      console.error("Error fetching workout:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkout();
  }, []);

  const ownerName =
    workout?.user?.username ?? workout?.user?.full_name ?? "Unknown";

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Link
          href="/workouts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to workouts</span>
        </Link>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-gray-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            <span>Loading…</span>
          </div>
        ) : workout ? (
          <div className="mt-3 space-y-6">
            <WorkoutDetailCard workout={workout} ownerName={ownerName} />
            <ExerciseContainer workout={workout} />
          </div>
        ) : (
          <p className="mt-6 text-gray-500">Workout not found.</p>
        )}
      </div>
    </div>
  );
}
