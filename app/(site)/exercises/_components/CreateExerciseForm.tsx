"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { InputField } from "@/app/_components/FormFields";

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
      <InputField
        id="exerciseName"
        label="Exercise Name"
        type="text"
        placeholder="e.g., Barbell Bench Press"
        autoComplete="off"
        onChange={(e) => setExercise((prev) => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
      />

      <InputField
        id="primaryMuscle"
        label="Primary Muscle Group"
        type="text"
        placeholder="e.g., Chest"
        autoComplete="off"
        onChange={(e) => setExercise((prev) => ({ ...prev, primary_muscle: (e.target as HTMLInputElement).value }))}
      />

      <InputField
        id="otherMuscles"
        label="Other Muscles"
        type="text"
        placeholder="e.g., Triceps, Shoulders"
        autoComplete="off"
        onChange={(e) => setExercise((prev) => ({ ...prev, other_muscles: (e.target as HTMLInputElement).value }))}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Optional. Separate multiple muscles with commas.
      </p>

      <InputField
        id="exerciseType"
        label="Exercise Type"
        type="text"
        placeholder="e.g., Compound, Isolation"
        autoComplete="off"
        onChange={(e) => setExercise((prev) => ({ ...prev, type: (e.target as HTMLInputElement).value }))}
      />

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to exercises</span>
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Create Exercise"}
        </button>
      </div>
    </form>
  );
};

export default CreateExerciseForm;
