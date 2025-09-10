"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import type { Tables } from "@/types/database.types";
import { InputField } from "@/app/_components/FormFields";

type Exercise = Tables<"exercises">;

type Props = {
  exercise: Exercise | null;
};

const UpdateExerciseForm = ({ exercise }: Props) => {
  const [updatedExercise, setUpdatedExercise] = useState<Partial<Exercise>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const deleteBtnRef = useRef<HTMLButtonElement | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!exercise) return;

    try {
      setIsLoading(true);

      const res = await fetch(`/api/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExercise), // send only changed fields
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      console.log("Updated exercise:", result.data);

      // navigate back to exercises list
      router.push("/exercises");
    } catch (err) {
      console.error("Error updating exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!exercise) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/exercises/${exercise.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed with ${res.status}`);
      }
      setConfirmOpen(false);
      router.push("/exercises");
      router.refresh();
    } catch (err) {
      console.error("Error deleting exercise:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Accessibility: focus handling + keyboard support for modal
  useEffect(() => {
    if (!confirmOpen) return;
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
      <InputField
        id="exerciseName"
        label="Exercise Name"
        type="text"
        defaultValue={exercise?.name ?? ""}
        placeholder="e.g., Barbell Bench Press"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            name: (e.target as HTMLInputElement).value,
          }))
        }
      />
      <InputField
        id="primaryMuscle"
        label="Primary Muscle Group"
        type="text"
        defaultValue={exercise?.primary_muscle ?? ""}
        placeholder="e.g., Chest"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            primary_muscle: (e.target as HTMLInputElement).value,
          }))
        }
      />
      <InputField
        id="otherMuscles"
        label="Other Muscles"
        type="text"
        defaultValue={exercise?.other_muscles ?? ""}
        placeholder="e.g., Triceps, Shoulders"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            other_muscles: (e.target as HTMLInputElement).value,
          }))
        }
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Optional. Separate multiple muscles with commas.
      </p>
      <InputField
        id="exerciseType"
        label="Exercise Type"
        type="text"
        defaultValue={exercise?.type ?? ""}
        placeholder="e.g., Compound, Isolation"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            type: (e.target as HTMLInputElement).value,
          }))
        }
      />

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to exercises</span>
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-700 bg-transparent px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
              Delete exercise?
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800/70"
              >
                Cancel
              </button>
              <button
                ref={deleteBtnRef}
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-red-700 bg-transparent px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
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

export default UpdateExerciseForm;
