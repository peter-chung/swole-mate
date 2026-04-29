"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Calendar, Copy, MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:translate-y-px dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
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
                    <Pencil className="h-4 w-4" aria-hidden="true" />
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
                    <Copy className="h-4 w-4" aria-hidden="true" />
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
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>{isDeleting ? "Deleting..." : "Delete workout"}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {workout.name || "Untitled workout"}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {prettyDate(workout?.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {ownerName}
          </span>
        </p>
        {workout.notes && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
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
