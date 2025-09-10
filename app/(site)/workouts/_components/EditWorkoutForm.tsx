"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { Tables, TablesUpdate } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import ConfirmDialog from "@/app/_components/ConfirmDialog";

type Workout = Tables<"workouts">;
type WorkoutUpdate = TablesUpdate<"workouts">;

type Props = {
  workout: Workout | null;
};

const UpdateWorkoutForm = ({ workout }: Props) => {
  const [updatedWorkout, setUpdatedWorkout] = useState<WorkoutUpdate>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workout) return;

    try {
      setIsLoading(true);

      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkout),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push(`/workouts/${workout.id}`);
    } catch (err) {
      console.error("Error updating workout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workout) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setConfirmOpen(false);
      router.push("/workouts");
    } catch (err) {
      console.error("Error deleting workout:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Workout Details
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
          className="inline-flex items-center rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          {isDeleting ? "Deleting..." : "Delete Workout"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputField
          id="workoutName"
          label="Workout Name"
          type="text"
          name="name"
          defaultValue={workout?.name ?? ""}
          onChange={(e) =>
            setUpdatedWorkout((prev) => ({
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
          defaultValue={workout?.date ?? ""}
          onChange={(e) =>
            setUpdatedWorkout((prev) => ({
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
          defaultValue={workout?.notes ?? ""}
          onChange={(e) =>
            setUpdatedWorkout((prev) => ({
              ...prev,
              notes: (e.target as HTMLTextAreaElement).value,
            }))
          }
          containerClassName="sm:col-span-2"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete workout?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmLoading={isDeleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </form>
  );
};

export default UpdateWorkoutForm;
