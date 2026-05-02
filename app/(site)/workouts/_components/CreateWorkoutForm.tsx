"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import type { TablesInsert } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import { createWorkoutAction } from "../actions";
import Button from "@/app/_components/Button";

type NewWorkout = TablesInsert<"workouts">;

const CreateWorkoutForm = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Default date to today in local time (YYYY-MM-DD). Avoid UTC offset issues.
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const [workout, setWorkout] = useState<Partial<NewWorkout>>({
    date: today,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = typeof workout.name === "string" ? workout.name.trim() : "";
    if (!name) return;

    const date =
      typeof workout.date === "string" && workout.date ? workout.date : today;
    const notes =
      typeof workout.notes === "string" && workout.notes.length > 0
        ? workout.notes
        : null;

    startTransition(async () => {
      try {
        const result = await createWorkoutAction({
          name,
          date,
          notes,
        });

        if (result?.id) {
          router.push(`/workouts/${result.id}/edit`);
        } else {
          router.push("/workouts");
        }
      } catch (err) {
        console.error("Error creating workout:", err);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4">
        <Link
          href="/workouts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to workouts</span>
        </Link>
      </div>
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <InputField
        id="workoutName"
        label="Workout Name"
        type="text"
        placeholder="e.g., Push day!"
        name="name"
        autoComplete="off"
        onChange={(e) =>
          setWorkout((prev) => ({
            ...prev,
            name: (e.target as HTMLInputElement).value,
          }))
        }
        required
      />

      <InputField
        id="workoutDate"
        label="Date"
        type="date"
        name="date"
        defaultValue={today}
        onChange={(e) =>
          setWorkout((prev) => ({
            ...prev,
            date: (e.target as HTMLInputElement).value,
          }))
        }
        required
      />

      <TextAreaField
        id="workoutNotes"
        label="Notes"
        name="notes"
        placeholder="Optional notes about this workout"
        onChange={(e) =>
          setWorkout((prev) => ({
            ...prev,
            notes: (e.target as HTMLTextAreaElement).value,
          }))
        }
      />

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
        >
          Create Workout
        </Button>
      </div>
    </form>
    </div>
  );
};

export default CreateWorkoutForm;
