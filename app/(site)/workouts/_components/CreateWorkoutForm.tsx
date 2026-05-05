"use client";

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
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="space-y-5 py-4 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:p-6 sm:shadow-sm sm:dark:border-neutral-800 sm:dark:bg-neutral-900">
        <InputField
          id="workoutName"
          label="Workout Name"
          type="text"
          placeholder="e.g., Push day!"
          name="name"
          autoComplete="off"
          className="!bg-transparent !shadow-none dark:!bg-transparent"
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
          className="!bg-transparent !shadow-none dark:!bg-transparent"
          containerClassName="w-full overflow-hidden"
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
          className="!bg-transparent !shadow-none dark:!bg-transparent"
          value={workout.notes ?? ""}
          onChange={(e) =>
            setWorkout((prev) => ({
              ...prev,
              notes: (e.target as HTMLTextAreaElement).value,
            }))
          }
          onClear={() => setWorkout((prev) => ({ ...prev, notes: "" }))}
        />

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            className="w-full sm:w-auto"
          >
            Create Workout
          </Button>
        </div>
      </div>
    </form>
    </div>
  );
};

export default CreateWorkoutForm;
