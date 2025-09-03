"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const CreateExerciseForm = () => {
  const [exercise, setExercise] = useState({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exercise),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/exercises");
    } catch (err) {
      console.error("Error creating exercise:", err);
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
          htmlFor="exerciseName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Exercise Name
        </label>
        <input
          id="exerciseName"
          type="text"
          placeholder="e.g., Barbell Bench Press"
          autoComplete="off"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setExercise((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="primaryMuscle"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Primary Muscle Group
        </label>
        <input
          id="primaryMuscle"
          type="text"
          placeholder="e.g., Chest"
          autoComplete="off"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setExercise((prev) => ({ ...prev, primary_muscle: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="otherMuscles"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Other Muscles
        </label>
        <input
          id="otherMuscles"
          type="text"
          placeholder="e.g., Triceps, Shoulders"
          autoComplete="off"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setExercise((prev) => ({ ...prev, other_muscles: e.target.value }))
          }
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Optional. Separate multiple muscles with commas.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="exerciseType"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Exercise Type
        </label>
        <input
          id="exerciseType"
          type="text"
          placeholder="e.g., Compound, Isolation"
          autoComplete="off"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setExercise((prev) => ({ ...prev, type: e.target.value }))
          }
        />
      </div>

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/exercises"
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800/70"
        >
          ← Back
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Create Exercise"}
        </button>
      </div>
    </form>
  );
};

export default CreateExerciseForm;
