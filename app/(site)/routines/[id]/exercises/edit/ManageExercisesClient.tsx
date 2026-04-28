"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import { InputField } from "@/app/_components/FormFields";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import AddRoutineExerciseModal from "../../../_components/AddRoutineExerciseModal";
import RoutineSetForm, {
  RoutineSetFormHandle,
} from "../../../_components/RoutineSetForm";
import { prettyDate } from "@/utils/format";
import type { RoutineWithRelations } from "../../../_lib/getRoutine";
import {
  deleteRoutineExerciseAction,
  updateRoutineExerciseAction,
} from "../../../actions";

type ManageExercisesClientProps = {
  routine: RoutineWithRelations;
};

type ExerciseMetaDraft = {
  equipmentBrand: string;
};

const buildExerciseMetaDrafts = (
  exercises: RoutineWithRelations["routine_exercises"] = [],
) =>
  (exercises ?? []).reduce<Record<number, ExerciseMetaDraft>>(
    (acc, exercise) => {
      acc[exercise.id] = {
        equipmentBrand: exercise.equipment_brand ?? "",
      };
      return acc;
    },
    {},
  );

const ManageExercisesClient = ({
  routine: initialRoutine,
}: ManageExercisesClientProps) => {
  const [routine, setRoutine] = useState(initialRoutine);
  const [exerciseMetaDrafts, setExerciseMetaDrafts] = useState(() =>
    buildExerciseMetaDrafts(initialRoutine.routine_exercises),
  );
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [confirmExerciseId, setConfirmExerciseId] = useState<number | null>(
    null
  );

  const formRefs = useRef<Record<number, RoutineSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});

  const routineId = String(routine.id);
  const exerciseMetaDirtyIds = useMemo(
    () =>
      (routine.routine_exercises ?? [])
        .filter(
          (re) =>
            (exerciseMetaDrafts[re.id]?.equipmentBrand ?? "") !==
            (re.equipment_brand ?? ""),
        )
        .map((re) => re.id),
    [exerciseMetaDrafts, routine.routine_exercises],
  );
  const hasExerciseMetaDirty = exerciseMetaDirtyIds.length > 0;
  const anyDirty = Boolean(
    hasExerciseMetaDirty ||
      routine.routine_exercises?.some((re) => !!dirtyMap[re.id])
  );

  const fetchRoutine = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        const res = await fetch(
          `/api/routines/${encodeURIComponent(routineId)}`
        );
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setRoutine(result.data as RoutineWithRelations);
        setExerciseMetaDrafts(
          buildExerciseMetaDrafts(
            (result.data as RoutineWithRelations).routine_exercises,
          ),
        );
        setDirtyMap({});
      } catch (err) {
        console.error("Error fetching routine:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to refresh routine"
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [routineId]
  );

  const handleDeleteExercise = useCallback(
    async (routineExerciseId: number) => {
      if (!routineExerciseId) return;
      try {
        setDeletingId(routineExerciseId);
        await deleteRoutineExerciseAction({ routineId, routineExerciseId });
        await fetchRoutine({ silent: true });
      } catch (err) {
        console.error("Error deleting routine exercise:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete exercise"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [fetchRoutine, routineId]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={`/routines/${String(routine.id)}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to routine</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Manage Exercises
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {routine.name ? (
            <span className="truncate">{routine.name}</span>
          ) : (
            routine.date && <span className="truncate">{routine.date}</span>
          )}
        </div>
      </header>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : (
        <>
          <section className="mb-6 rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-medium text-gray-900 dark:text-white">
                  Routine Summary
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {routine.date && <span>{prettyDate(routine.date)}</span>}
                </div>
              </div>
              <Link
                href={`/routines/${String(routine.id)}/edit`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 active:translate-y-px dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
              >
                Edit routine details
              </Link>
            </div>
            {routine.notes && (
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                {routine.notes}
              </p>
            )}
          </section>

          <section className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              Exercises
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!routine.routine_exercises?.length) return;
                  try {
                    setSavingAll(true);
                    const exerciseMetaSaves = routine.routine_exercises
                      .filter((re) => exerciseMetaDirtyIds.includes(re.id))
                      .map((re) =>
                        updateRoutineExerciseAction({
                          routineId,
                          routineExerciseId: re.id,
                          equipmentBrand:
                            exerciseMetaDrafts[re.id]?.equipmentBrand ?? "",
                        }),
                      );
                    await Promise.all(exerciseMetaSaves);

                    const saves = routine.routine_exercises.map(async (re) => {
                      const handle = formRefs.current[re.id];
                      if (handle?.save) {
                        try {
                          await handle.save({ silent: true });
                        } catch (e) {
                          throw new Error(
                            `Failed saving sets for exercise ${re.id}`
                          );
                        }
                      }
                    });
                    await Promise.all(saves);
                    await fetchRoutine({ silent: true });
                    toast.success("All changes saved");
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to save some exercises"
                    );
                  } finally {
                    setSavingAll(false);
                  }
                }}
                disabled={savingAll || loading || !anyDirty}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
              >
                {savingAll
                  ? "Saving All…"
                  : anyDirty
                  ? "Save All"
                  : "No Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px cursor-pointer dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
              >
                + Add Exercise
              </button>
            </div>
          </section>

          {routine.routine_exercises && routine.routine_exercises.length > 0 ? (
            <div className="space-y-4">
              {routine.routine_exercises.map((re) => (
                <div
                  key={re.id}
                  className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {re.exercise?.name ??
                          (re.custom_exercise_id ? "Custom" : "Exercise")}
                        {dirtyMap[re.id] ||
                        exerciseMetaDirtyIds.includes(re.id) ? (
                          <span className="ml-2 inline-flex items-center rounded-full border border-amber-400 px-2 py-0.5 text-[10px] font-normal text-amber-700 dark:border-amber-500 dark:text-amber-400">
                            Unsaved changes
                          </span>
                        ) : null}
                      </h3>
                    </div>
                    <div className="sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => setConfirmExerciseId(re.id)}
                        disabled={deletingId === re.id || loading}
                        className="inline-flex items-center rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        {deletingId === re.id ? "Deleting…" : "Delete Exercise"}
                      </button>
                    </div>
                  </div>
                  <InputField
                    id={`routine-exercise-brand-${re.id}`}
                    label="Equipment Brand"
                    type="text"
                    placeholder="Optional, e.g., Hammer Strength"
                    value={exerciseMetaDrafts[re.id]?.equipmentBrand ?? ""}
                    onChange={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      setExerciseMetaDrafts((prev) => ({
                        ...prev,
                        [re.id]: {
                          equipmentBrand: value,
                        },
                      }));
                    }}
                    containerClassName="mt-3 max-w-sm"
                  />
                  <div className="mt-3 sm:mt-4">
                    <RoutineSetForm
                      routineId={routineId}
                      routineExerciseId={re.id}
                      routineSets={re.routine_sets ?? []}
                      onSaved={() => {
                        void fetchRoutine({ silent: true });
                      }}
                      onDirtyChange={(dirty) =>
                        setDirtyMap((prev) => ({ ...prev, [re.id]: dirty }))
                      }
                      ref={(handle) => {
                        formRefs.current[re.id] = handle;
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
              No exercises yet. Use “Add Exercise” to begin.
            </div>
          )}
        </>
      )}

      <AddRoutineExerciseModal
        open={isAddModalOpen}
        routineId={routineId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          void fetchRoutine({ silent: true });
        }}
      />

      <ConfirmDialog
        open={!!confirmExerciseId}
        title="Delete exercise?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={
          deletingId === confirmExerciseId ? "Deleting..." : "Delete"
        }
        confirmLoading={deletingId === confirmExerciseId}
        onCancel={() => setConfirmExerciseId(null)}
        onConfirm={async () => {
          if (!confirmExerciseId) return;
          await handleDeleteExercise(confirmExerciseId);
          setConfirmExerciseId(null);
        }}
      />
    </div>
  );
};

export default ManageExercisesClient;
