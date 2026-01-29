"use client";

import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import type { Tables, TablesUpdate } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import {
  deleteWorkoutAction,
  updateWorkoutAction,
} from "../actions";

type Workout = Tables<"workouts">;
type WorkoutUpdate = TablesUpdate<"workouts">;

type Props = {
  workout: Workout | null;
};

const UpdateWorkoutForm = ({ workout }: Props) => {
  const [updatedWorkout, setUpdatedWorkout] = useState<WorkoutUpdate>({});
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [isUpdating, startUpdate] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workout) return;

    const payloadEntries = Object.entries(updatedWorkout);
    if (payloadEntries.length === 0) {
      router.push(`/workouts/${workout.id}`);
      return;
    }

    const sanitized: Partial<WorkoutUpdate> = {};

    if (updatedWorkout.name !== undefined) {
      sanitized.name =
        typeof updatedWorkout.name === "string"
          ? updatedWorkout.name.trim()
          : updatedWorkout.name;
    }
    if (updatedWorkout.date !== undefined) {
      sanitized.date =
        typeof updatedWorkout.date === "string"
          ? updatedWorkout.date
          : updatedWorkout.date;
    }
    if (updatedWorkout.notes !== undefined) {
      sanitized.notes =
        typeof updatedWorkout.notes === "string"
          ? updatedWorkout.notes
          : updatedWorkout.notes;
    }

    startUpdate(async () => {
      try {
        await updateWorkoutAction(String(workout.id), sanitized);
        router.push(`/workouts/${workout.id}`);
      } catch (err) {
        console.error("Error updating workout:", err);
      }
    });
  };

  const handleDelete = async () => {
    if (!workout) return;
    startDelete(async () => {
      try {
        await deleteWorkoutAction(String(workout.id));
        setConfirmOpen(false);
        router.push("/workouts");
      } catch (err) {
        console.error("Error deleting workout:", err);
      }
    });
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
          disabled={isUpdating}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px disabled:opacity-60"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
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
