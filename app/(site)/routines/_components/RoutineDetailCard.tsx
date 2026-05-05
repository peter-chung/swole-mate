"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Calendar, MoreVertical, Pencil, Play, Trash2, User } from "lucide-react";
import { prettyDate } from "@/utils/format";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import type { RoutineWithRelations } from "../_lib/getRoutine";
import { startWorkoutFromRoutineAction } from "../actions";
import Button from "@/app/_components/Button";

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
          toast.success(`Workout started — ${result.skippedExercises} exercise(s) could not be added.`);
        }
        if (result?.id) router.push(`/workouts/${result.id}/edit`);
      } catch (error) {
        toast.error("Failed to start workout.");
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
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {routine.name || "Untitled routine"}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative" data-routine-actions-menu>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Routine actions"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 active:translate-y-px dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 min-w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
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
                  <div className="my-1 h-px bg-gray-200 dark:bg-neutral-700" />
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
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {prettyDate(routine?.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {ownerName}
          </span>
        </p>
        {routine.notes && (
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {routine.notes}
          </p>
        )}
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            isLoading={isPending}
            onClick={handleStartWorkout}
            className="w-full gap-1.5"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>Start Workout</span>
          </Button>
        </div>
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
