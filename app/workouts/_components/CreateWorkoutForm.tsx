"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { TablesInsert } from "@/types/database.types";

type NewWorkout = TablesInsert<"workouts">;

const CreateWorkoutForm = () => {
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

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
    >
      <div className="space-y-2">
        <label
          htmlFor="workoutName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Workout Name
        </label>
        <input
          id="workoutName"
          type="text"
          placeholder="e.g., Push day!"
          name="name"
          autoComplete="off"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setWorkout((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="workoutDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Date
        </label>
        <input
          id="workoutDate"
          type="date"
          name="date"
          defaultValue={today}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setWorkout((prev) => ({ ...prev, date: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="workoutNotes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Notes
        </label>
        <textarea
          id="workoutNotes"
          rows={4}
          name="notes"
          placeholder="Optional notes about this workout"
          className="block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setWorkout((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/workouts"
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800/70"
        >
          ← Back
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Create Workout"}
        </button>
      </div>
    </form>
  );
};

export default CreateWorkoutForm;
