"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { prettyDate } from "@/utils/format";
import type { Tables } from "@/types/database.types";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import SaveAsRoutineButton from "./SaveAsRoutineButton";
import { copyWorkoutAction, deleteWorkoutAction } from "../actions";

type Workout = Tables<"workouts">;
type Props = {
  workout: Workout;
  ownerName: string;
  canEdit: boolean;
  canCopy: boolean;
  canSaveAsRoutine: boolean;
};

const WorkoutDetailCard = ({
  workout,
  ownerName,
  canEdit,
  canCopy,
  canSaveAsRoutine,
}: Props) => {
  const router = useRouter();
  const [isCopying, startCopy] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const showActions = canEdit || canCopy || canSaveAsRoutine;

  const handleCopy = () => {
    startCopy(async () => {
      try {
        const result = await copyWorkoutAction(workout.id);
        if (result?.skippedExercises && result.skippedExercises > 0) {
          console.info(
            `Skipped ${result.skippedExercises} exercise(s) that could not be copied.`
          );
        }

        if (result?.id) {
          router.push(`/workouts/${result.id}/edit`);
        }
        setIsMenuOpen(false);
      } catch (error) {
        console.error("Error copying workout:", error);
      }
    });
  };

  const handleDelete = () => {
    startDelete(async () => {
      try {
        await deleteWorkoutAction(workout.id);
        setConfirmDeleteOpen(false);
        setIsMenuOpen(false);
        router.push("/workouts");
      } catch (error) {
        console.error("Error deleting workout:", error);
      }
    });
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-workout-actions-menu]")) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Workout Details
        </h2>
        {showActions && (
          <div className="relative" data-workout-actions-menu>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Workout actions"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-lg leading-none text-gray-700 shadow-sm transition hover:bg-gray-50 active:translate-y-px dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
            >
              ...
            </button>
            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 min-w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-neutral-900"
              >
                {canEdit && (
                  <Link
                    href={`/workouts/${workout.id}/edit`}
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-neutral-800"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M16.862 4.487a2.25 2.25 0 0 1 3.182 3.182l-9.21 9.21a6.75 6.75 0 0 1-2.83 1.68l-2.492.71a.75.75 0 0 1-.92-.92l.71-2.492a6.75 6.75 0 0 1 1.68-2.83z" />
                      <path d="m15 6 3 3" />
                    </svg>
                    <span>Edit workout</span>
                  </Link>
                )}
                {canCopy && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopy}
                    disabled={isCopying}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-100 dark:hover:bg-neutral-800"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M8 16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                    </svg>
                    <span>{isCopying ? "Copying..." : "Copy workout"}</span>
                  </button>
                )}
                {canSaveAsRoutine && (
                  <SaveAsRoutineButton
                    workoutId={workout.id}
                    defaultTitle={workout.name ?? ""}
                    buttonClassName="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm font-normal text-gray-800 transition hover:bg-gray-100 active:translate-y-px dark:text-gray-100 dark:hover:bg-neutral-800"
                  />
                )}
                {canEdit && (
                  <>
                    <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setConfirmDeleteOpen(true);
                      }}
                      disabled={isDeleting}
                      className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                      <span>{isDeleting ? "Deleting..." : "Delete workout"}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {workout.name || "Untitled workout"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <span>{prettyDate(workout?.date)}</span>
              <span className="mx-2">|</span>
              <span>By {ownerName}</span>
            </p>
          </div>
        </div>
        {workout.notes && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {workout.notes}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete workout?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmLoading={isDeleting}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default WorkoutDetailCard;
