"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { TablesInsert } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";

type NewWorkout = TablesInsert<"workouts">;

const CreateWorkoutForm = () => {
  const [workout, setWorkout] = useState<Partial<NewWorkout>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  // Default date to today in local time (YYYY-MM-DD). Avoid UTC offset issues.
  const today = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

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

      const createdId: string | number | undefined =
        (result && typeof result === "object" && "id" in result
          ? (result as { id?: string | number }).id
          : undefined) ??
        (result && typeof result === "object" && "data" in result
          ? (result as { data?: { id?: string | number } }).data?.id
          : undefined);

      if (createdId) {
        router.push(`/workouts/${createdId}/edit`);
      } else {
        router.push("/workouts");
      }
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
      <InputField
        id="workoutName"
        label="Workout Name"
        type="text"
        placeholder="e.g., Push day!"
        name="name"
        autoComplete="off"
        onChange={(e) => setWorkout((prev) => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
        required
      />

      <InputField
        id="workoutDate"
        label="Date"
        type="date"
        name="date"
        defaultValue={today}
        onChange={(e) => setWorkout((prev) => ({ ...prev, date: (e.target as HTMLInputElement).value }))}
        required
      />

      <TextAreaField
        id="workoutNotes"
        label="Notes"
        name="notes"
        placeholder="Optional notes about this workout"
        onChange={(e) => setWorkout((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))}
      />

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/workouts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to workouts</span>
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Create Workout"}
        </button>
      </div>
    </form>
  );
};

export default CreateWorkoutForm;
