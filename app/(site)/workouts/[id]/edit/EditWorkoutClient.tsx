"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import AddWorkoutExerciseModal from "../../_components/AddWorkoutExerciseModal";
import ExerciseSetForm, {
  ExerciseSetFormHandle,
} from "../../_components/ExerciseSetForm";
import { prettyDate } from "@/utils/format";
import { deleteWorkoutAction, updateWorkoutAction } from "../../actions";
import type { WorkoutWithRelations } from "../../_lib/getWorkout";

type EditWorkoutClientProps = {
  workout: WorkoutWithRelations;
};

type WorkoutDraft = {
  name: string;
  date: string;
  notes: string;
};

const toDraft = (workout: WorkoutWithRelations): WorkoutDraft => ({
  name: workout.name ?? "",
  date: workout.date ?? "",
  notes: workout.notes ?? "",
});

const EditWorkoutClient = ({
  workout: initialWorkout,
}: EditWorkoutClientProps) => {
  const [workout, setWorkout] = useState(initialWorkout);
  const [detailsDraft, setDetailsDraft] = useState<WorkoutDraft>(
    toDraft(initialWorkout),
  );
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [deletingWorkout, setDeletingWorkout] = useState(false);
  const [pendingDeletedExerciseIds, setPendingDeletedExerciseIds] = useState<
    number[]
  >([]);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmDeleteWorkoutOpen, setConfirmDeleteWorkoutOpen] =
    useState(false);
  const [openActionsExerciseId, setOpenActionsExerciseId] = useState<
    number | null
  >(null);

  const router = useRouter();
  const formRefs = useRef<Record<number, ExerciseSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});

  const workoutId = String(workout.id);
  const detailsDirty =
    detailsDraft.name !== (workout.name ?? "") ||
    detailsDraft.date !== (workout.date ?? "") ||
    detailsDraft.notes !== (workout.notes ?? "");

  const anyDirty = Boolean(
    detailsDirty ||
      pendingDeletedExerciseIds.length > 0 ||
      workout.workout_exercises?.some((we) => !!dirtyMap[we.id]),
  );

  const fetchWorkout = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        const res = await fetch(
          `/api/workouts/${encodeURIComponent(workoutId)}`,
        );
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        setWorkout(result.data as WorkoutWithRelations);
        setPendingDeletedExerciseIds([]);
        setDirtyMap({});
      } catch (err) {
        console.error("Error fetching workout:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to refresh workout",
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [workoutId],
  );

  const stageDeleteExercise = useCallback((workoutExerciseId: number) => {
    if (!workoutExerciseId) return;
    setPendingDeletedExerciseIds((prev) =>
      prev.includes(workoutExerciseId) ? prev : [...prev, workoutExerciseId],
    );
    setWorkout((prev) => ({
      ...prev,
      workout_exercises: (prev.workout_exercises ?? []).filter(
        (we) => we.id !== workoutExerciseId,
      ),
    }));
    setDirtyMap((prev) => {
      const next = { ...prev };
      delete next[workoutExerciseId];
      return next;
    });
  }, []);

  const persistDeleteExercise = useCallback(
    async (workoutExerciseId: number) => {
      const res = await fetch(
        `/api/workouts/${encodeURIComponent(
          workoutId,
        )}/workout-exercises/${workoutExerciseId}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete exercise");
    },
    [workoutId],
  );

  const handleSaveAll = useCallback(async () => {
    if (
      !anyDirty &&
      !workout.workout_exercises?.length &&
      pendingDeletedExerciseIds.length === 0
    ) {
      return true;
    }

    try {
      setSavingAll(true);

      if (detailsDirty) {
        const trimmedName = detailsDraft.name.trim();
        if (!trimmedName) {
          throw new Error("Workout name is required");
        }
        if (!detailsDraft.date) {
          throw new Error("Workout date is required");
        }

        const payload = {
          name: trimmedName,
          date: detailsDraft.date,
          notes: detailsDraft.notes,
        };

        await updateWorkoutAction(workoutId, payload);
        setDetailsDraft({
          name: payload.name,
          date: payload.date,
          notes: payload.notes ?? "",
        });
      }

      const deletionsToPersist = [...pendingDeletedExerciseIds];
      const deletionResults = await Promise.allSettled(
        deletionsToPersist.map((id) => persistDeleteExercise(id)),
      );
      const deletionSucceededIds = new Set<number>(
        deletionResults.flatMap((result, idx) =>
          result.status === "fulfilled" ? [deletionsToPersist[idx]] : [],
        ),
      );
      const deletionFailed = deletionResults.some(
        (result) => result.status === "rejected",
      );
      setPendingDeletedExerciseIds((prev) =>
        prev.filter((id) => !deletionSucceededIds.has(id)),
      );
      if (deletionFailed) {
        throw new Error("Failed to delete some exercises");
      }

      const saves = (workout.workout_exercises ?? []).map(async (we) => {
        const handle = formRefs.current[we.id];
        if (handle?.save) {
          try {
            await handle.save({ silent: true });
          } catch {
            throw new Error(
              `Failed saving sets for exercise ${we.exercise?.name ?? we.id}`,
            );
          }
        }
      });
      await Promise.all(saves);

      await fetchWorkout({ silent: true });
      toast.success("All changes saved");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save some changes",
      );
      return false;
    } finally {
      setSavingAll(false);
    }
  }, [
    anyDirty,
    detailsDirty,
    detailsDraft.date,
    detailsDraft.name,
    detailsDraft.notes,
    fetchWorkout,
    pendingDeletedExerciseIds,
    persistDeleteExercise,
    workout.workout_exercises,
    workoutId,
  ]);

  const handleCancel = useCallback(() => {
    if (!anyDirty) {
      router.push(`/workouts/${String(workout.id)}`);
      return;
    }
    setConfirmDiscardOpen(true);
  }, [anyDirty, router, workout.id]);

  const handleSaveAndExit = useCallback(async () => {
    if (!anyDirty) {
      router.push(`/workouts/${String(workout.id)}`);
      return;
    }
    const ok = await handleSaveAll();
    if (ok) {
      router.push(`/workouts/${String(workout.id)}`);
    }
  }, [anyDirty, handleSaveAll, router, workout.id]);

  const handleDeleteWorkout = useCallback(async () => {
    try {
      setDeletingWorkout(true);
      await deleteWorkoutAction(workoutId);
      setConfirmDeleteWorkoutOpen(false);
      router.push("/workouts");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete workout");
    } finally {
      setDeletingWorkout(false);
    }
  }, [router, workoutId]);

  useEffect(() => {
    if (openActionsExerciseId == null) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-exercise-actions-menu]")) {
        setOpenActionsExerciseId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenActionsExerciseId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionsExerciseId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={`/workouts/${String(workout.id)}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span aria-hidden>{"<-"}</span>
            <span>Back to workout</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Workout
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {workout.date && <span>{prettyDate(workout.date)}</span>}
        </div>
      </header>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : (
        <>
          <section className="mb-6 rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-medium text-gray-900 dark:text-white">
                Workout Details
              </h2>
              <button
                type="button"
                onClick={() => setConfirmDeleteWorkoutOpen(true)}
                disabled={savingAll || deletingWorkout}
                className="inline-flex items-center rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {deletingWorkout ? "Deleting..." : "Delete Workout"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                id="workoutName"
                label="Workout Name"
                type="text"
                name="name"
                value={detailsDraft.name}
                onChange={(e) =>
                  setDetailsDraft((prev) => ({
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
                value={detailsDraft.date}
                onChange={(e) =>
                  setDetailsDraft((prev) => ({
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
                value={detailsDraft.notes}
                onChange={(e) =>
                  setDetailsDraft((prev) => ({
                    ...prev,
                    notes: (e.target as HTMLTextAreaElement).value,
                  }))
                }
                containerClassName="sm:col-span-2"
              />
            </div>
          </section>

          <section className="mb-3">
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              Exercises
            </h2>
          </section>

          {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
            <div className="space-y-4">
              {workout.workout_exercises.map((we) => (
                <div
                  key={we.id}
                  className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {we.exercise?.name ?? "Exercise"}
                        {dirtyMap[we.id] ? (
                          <span className="ml-2 inline-flex items-center rounded-full border border-amber-400 px-2 py-0.5 text-[10px] font-normal text-amber-700 dark:border-amber-500 dark:text-amber-400">
                            Unsaved changes
                          </span>
                        ) : null}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {we.id}
                      </p>
                    </div>
                    <div
                      className="relative ml-auto shrink-0"
                      data-exercise-actions-menu
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenActionsExerciseId((prev) =>
                            prev === we.id ? null : we.id,
                          )
                        }
                        disabled={loading}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-lg leading-none text-gray-700 shadow-sm hover:bg-gray-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-900/40"
                        aria-label="Exercise actions"
                        aria-haspopup="menu"
                        aria-expanded={openActionsExerciseId === we.id}
                        title="Exercise actions"
                      >
                        ...
                      </button>
                      {openActionsExerciseId === we.id ? (
                        <div
                          className="absolute right-0 top-10 z-20 min-w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-neutral-900"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenActionsExerciseId(null);
                              stageDeleteExercise(we.id);
                            }}
                            className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            Remove exercise
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <ExerciseSetForm
                      workoutId={workoutId}
                      workoutExerciseId={we.id}
                      exerciseSets={we.exercise_sets ?? []}
                      onSaved={() => {
                        void fetchWorkout({ silent: true });
                      }}
                      onDirtyChange={(dirty) =>
                        setDirtyMap((prev) => ({ ...prev, [we.id]: dirty }))
                      }
                      ref={(handle) => {
                        formRefs.current[we.id] = handle;
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
              No exercises yet. Use "Add Exercise" to begin.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              + Add Exercise
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={savingAll || loading || deletingWorkout}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSaveAndExit();
                }}
                disabled={savingAll || loading || deletingWorkout}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
              >
                {savingAll ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </>
      )}

      <AddWorkoutExerciseModal
        open={isAddModalOpen}
        workoutId={workoutId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          void fetchWorkout({ silent: true });
        }}
      />

      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Discard unsaved changes?"
        description="All unsaved edits on this page will be lost."
        destructive
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          router.push(`/workouts/${String(workout.id)}`);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteWorkoutOpen}
        title="Delete workout?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={deletingWorkout ? "Deleting..." : "Delete"}
        confirmLoading={deletingWorkout}
        onCancel={() => setConfirmDeleteWorkoutOpen(false)}
        onConfirm={() => {
          void handleDeleteWorkout();
        }}
      />
    </div>
  );
};

export default EditWorkoutClient;
