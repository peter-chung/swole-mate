"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { TablesInsert } from "@/types/database.types";

type NewWorkout = TablesInsert<"workouts">;

const WorkoutExerciseForm = ({ workoutExercises, loading }) => {
  const [workout, setWorkout] = useState<Partial<NewWorkout>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  // Default date to today (YYYY-MM-DD) for the date input
  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workout),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/workouts");
    } catch (err) {
      console.error("Error creating workout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("workoutExercises in form:", workoutExercises);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
      {/* map over workoutExercises and display them */}
      <h2 className="text-lg font-semibold">Exercises in this Workout:</h2>
      {workoutExercises && workoutExercises.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5">
          {workoutExercises.map((we) => (
            <li key={we.id} className="text-gray-700 dark:text-gray-300">
              <p>Exercise name: {we.exercise.name}</p>
              {/* map over we.exercise_sets and display them */}
              <ul className="list-disc space-y-2 pl-5">
                {we.exercise_sets.map((es) => (
                  <li key={es.id}>
                    {es.reps} reps @ {es.weight} lbs
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No exercises added to this workout yet.</p>
      )}
      <div className="flex justify-between">
        <Link
          href="/workouts"
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default WorkoutExerciseForm;
