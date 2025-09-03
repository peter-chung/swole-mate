"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import type { Tables, TablesUpdate } from "@/types/database.types";

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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const deleteBtnRef = useRef<HTMLButtonElement | null>(null);

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
      const res = await fetch(`/api/workouts/${workout.id}`, { method: "DELETE" });
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

  // Accessibility: trap focus in modal and support Esc/Enter keys
  useEffect(() => {
    if (!confirmOpen) return;

    // Focus the cancel button initially for safer default
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmOpen(false);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        // Confirm delete on Enter
        deleteBtnRef.current?.click();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmOpen]);

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
          name="name"
          defaultValue={workout?.name ?? ""}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setUpdatedWorkout((prev) => ({ ...prev, name: e.target.value }))
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
          defaultValue={workout?.date ?? ""}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setUpdatedWorkout((prev) => ({ ...prev, date: e.target.value }))
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
          defaultValue={workout?.notes ?? ""}
          className="block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
          onChange={(e) =>
            setUpdatedWorkout((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={workout ? `/workouts/${workout.id}` : "/workouts"}
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800/70"
        >
          ← Back
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-700 bg-transparent px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-labelledby="confirm-title"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmOpen(false)}
          />
          <div
            ref={modalRef}
            className="relative z-10 w-full max-w-sm mx-4 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-neutral-900"
          >
            <h3
              id="confirm-title"
              className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              Delete workout?
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800/70"
              >
                Cancel
              </button>
              <button
                ref={deleteBtnRef}
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-red-700 bg-transparent px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default UpdateWorkoutForm;
