"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { prettyDate } from "@/utils/format";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import type { RoutineWithRelations } from "../_lib/getRoutine";
import { startWorkoutFromRoutineAction } from "../actions";

type Props = { routine: RoutineWithRelations; ownerName: string };

export default function RoutineDetailCard({ routine, ownerName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const handleStartWorkout = () => {
    startTransition(async () => {
      try {
        const result = await startWorkoutFromRoutineAction(routine.id);
        if (result?.skippedExercises && result.skippedExercises > 0) {
          console.info(`Skipped ${result.skippedExercises} exercise(s) that could not be added.`);
        }
        if (result?.id) router.push(`/workouts/${result.id}/edit`);
      } catch (error) {
        console.error("Error starting workout from routine:", error);
      }
    });
  };

  const handleDelete = () => {
    startDelete(async () => {
      try {
        const res = await fetch(`/api/routines/${routine.id}`, { method: "DELETE" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || `Request failed with ${res.status}`);
        }
        setConfirmDeleteOpen(false);
        toast.success("Routine deleted");
        router.push("/routines");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete routine");
      }
    });
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest("[data-routine-actions-menu]"))
        setIsMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
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
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {routine.name || "Untitled routine"}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleStartWorkout}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-green-500/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>{isPending ? "Starting..." : "Start Workout"}</span>
            </button>
            <div className="relative" data-routine-actions-menu>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Routine actions"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:translate-y-px dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 min-w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-neutral-900"
                >
                  <Link
                    href={`/routines/${routine.id}/edit`}
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-neutral-800"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span>Edit routine</span>
                  </Link>
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
                    <span>{isDeleting ? "Deleting..." : "Delete routine"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          <span>{prettyDate(routine?.date)}</span>
          <span className="mx-2">•</span>
          <span>By {ownerName}</span>
        </p>
        {routine.notes && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {routine.notes}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete routine?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmLoading={isDeleting}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
