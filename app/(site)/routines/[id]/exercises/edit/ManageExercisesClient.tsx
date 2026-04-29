"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import AddRoutineExerciseModal from "../../../_components/AddRoutineExerciseModal";
import RoutineSetForm, {
  RoutineSetFormHandle,
} from "../../../_components/RoutineSetForm";
import type { RoutineWithRelations } from "../../../_lib/getRoutine";
import {
  deleteRoutineExerciseAction,
  updateRoutineExerciseAction,
} from "../../../actions";

type ManageExercisesClientProps = {
  routine: RoutineWithRelations;
};

type DetailsDraft = {
  name: string;
  date: string;
  notes: string;
};

type ExerciseMetaDraft = {
  equipmentBrand: string;
};

const buildExerciseMetaDrafts = (
  exercises: RoutineWithRelations["routine_exercises"] = [],
) =>
  (exercises ?? []).reduce<Record<number, ExerciseMetaDraft>>(
    (acc, exercise) => {
      acc[exercise.id] = { equipmentBrand: exercise.equipment_brand ?? "" };
      return acc;
    },
    {},
  );

const toDraft = (routine: RoutineWithRelations): DetailsDraft => ({
  name: routine.name ?? "",
  date: routine.date ?? "",
  notes: routine.notes ?? "",
});

const ManageExercisesClient = ({
  routine: initialRoutine,
}: ManageExercisesClientProps) => {
  const router = useRouter();
  const [routine, setRoutine] = useState(initialRoutine);
  const [detailsDraft, setDetailsDraft] = useState<DetailsDraft>(toDraft(initialRoutine));
  const [exerciseMetaDrafts, setExerciseMetaDrafts] = useState(() =>
    buildExerciseMetaDrafts(initialRoutine.routine_exercises),
  );
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingExerciseId, setDeletingExerciseId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [confirmExerciseId, setConfirmExerciseId] = useState<number | null>(null);
  const [confirmDeleteRoutine, setConfirmDeleteRoutine] = useState(false);
  const [deletingRoutine, setDeletingRoutine] = useState(false);

  const formRefs = useRef<Record<number, RoutineSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});

  const routineId = String(routine.id);

  const detailsDirty =
    detailsDraft.name !== (routine.name ?? "") ||
    detailsDraft.date !== (routine.date ?? "") ||
    detailsDraft.notes !== (routine.notes ?? "");

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

  const anyDirty = Boolean(
    detailsDirty ||
      exerciseMetaDirtyIds.length > 0 ||
      routine.routine_exercises?.some((re) => !!dirtyMap[re.id]),
  );

  const fetchRoutine = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        const res = await fetch(`/api/routines/${encodeURIComponent(routineId)}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        const fetched = result.data as RoutineWithRelations;
        setRoutine(fetched);
        setExerciseMetaDrafts(buildExerciseMetaDrafts(fetched.routine_exercises));
        if (!silent) setDirtyMap({});
      } catch (err) {
        console.error("Error fetching routine:", err);
        toast.error(err instanceof Error ? err.message : "Failed to refresh routine");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [routineId],
  );

  const handleSaveAll = useCallback(async () => {
    try {
      setSavingAll(true);

      if (detailsDirty) {
        const res = await fetch(`/api/routines/${encodeURIComponent(routineId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: detailsDraft.name.trim() || null,
            date: detailsDraft.date || null,
            notes: detailsDraft.notes.trim() || null,
          }),
        });
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload?.error ?? "Failed to update routine details");
        }
      }

      const exerciseMetaSaves = (routine.routine_exercises ?? [])
        .filter((re) => exerciseMetaDirtyIds.includes(re.id))
        .map((re) =>
          updateRoutineExerciseAction({
            routineId,
            routineExerciseId: re.id,
            equipmentBrand: exerciseMetaDrafts[re.id]?.equipmentBrand ?? "",
          }),
        );
      await Promise.all(exerciseMetaSaves);

      const setsSaves = (routine.routine_exercises ?? []).map(async (re) => {
        const handle = formRefs.current[re.id];
        if (handle?.save) await handle.save({ silent: true });
      });
      await Promise.all(setsSaves);

      await fetchRoutine({ silent: true });
      toast.success("All changes saved");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
      return false;
    } finally {
      setSavingAll(false);
    }
  }, [detailsDirty, detailsDraft, exerciseMetaDirtyIds, exerciseMetaDrafts, fetchRoutine, routine.routine_exercises, routineId]);

  const handleSaveAndExit = useCallback(async () => {
    const ok = await handleSaveAll();
    if (ok) router.push(`/routines/${routineId}`);
  }, [handleSaveAll, router, routineId]);

  const handleCancel = useCallback(() => {
    if (anyDirty) {
      setDetailsDraft(toDraft(routine));
      setExerciseMetaDrafts(buildExerciseMetaDrafts(routine.routine_exercises));
      setDirtyMap({});
    }
    router.push(`/routines/${routineId}`);
  }, [anyDirty, routine, routineId, router]);

  const handleDeleteExercise = useCallback(
    async (routineExerciseId: number) => {
      try {
        setDeletingExerciseId(routineExerciseId);
        await deleteRoutineExerciseAction({ routineId, routineExerciseId });
        await fetchRoutine({ silent: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete exercise");
      } finally {
        setDeletingExerciseId(null);
      }
    },
    [fetchRoutine, routineId],
  );

  const handleDeleteRoutine = useCallback(async () => {
    try {
      setDeletingRoutine(true);
      const res = await fetch(`/api/routines/${encodeURIComponent(routineId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error ?? "Failed to delete routine");
      }
      toast.success("Routine deleted");
      router.push("/routines");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete routine");
    } finally {
      setDeletingRoutine(false);
      setConfirmDeleteRoutine(false);
    }
  }, [routineId, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-36 sm:pb-24 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Link
          href={`/routines/${routineId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to routine</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : (
        <>
          {/* Details */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Routine Details
              </h2>
              <button
                type="button"
                onClick={() => setConfirmDeleteRoutine(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Routine
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                id="routineName"
                label="Routine Name"
                type="text"
                value={detailsDraft.name}
                onChange={(e) =>
                  setDetailsDraft((p) => ({ ...p, name: (e.target as HTMLInputElement).value }))
                }
              />
              <InputField
                id="routineDate"
                label="Date"
                type="date"
                value={detailsDraft.date}
                onChange={(e) =>
                  setDetailsDraft((p) => ({ ...p, date: (e.target as HTMLInputElement).value }))
                }
              />
              <TextAreaField
                id="routineNotes"
                label="Notes"
                placeholder="Optional notes about this routine"
                value={detailsDraft.notes}
                containerClassName="sm:col-span-2"
                onChange={(e) =>
                  setDetailsDraft((p) => ({ ...p, notes: (e.target as HTMLTextAreaElement).value }))
                }
              />
            </div>
          </div>

          {/* Exercises */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exercises
            </h2>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px cursor-pointer dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </button>
          </div>

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
                        {re.exercise?.name ?? (re.custom_exercise_id ? "Custom" : "Exercise")}
                        {(dirtyMap[re.id] || exerciseMetaDirtyIds.includes(re.id)) && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-amber-400 px-2 py-0.5 text-[10px] font-normal text-amber-700 dark:border-amber-500 dark:text-amber-400">
                            Unsaved changes
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => setConfirmExerciseId(re.id)}
                        disabled={deletingExerciseId === re.id || loading}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingExerciseId === re.id ? "Deleting…" : "Remove"}
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
                        [re.id]: { equipmentBrand: value },
                      }));
                    }}
                    containerClassName="mt-3 max-w-sm"
                  />
                  <div className="mt-3 sm:mt-4">
                    <RoutineSetForm
                      routineId={routineId}
                      routineExerciseId={re.id}
                      routineSets={re.routine_sets ?? []}
                      exerciseType={re.exercise ?? null}
                      onSaved={() => void fetchRoutine({ silent: true })}
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
              No exercises yet. Use "Add Exercise" to begin.
            </div>
          )}
        </>
      )}

      <AddRoutineExerciseModal
        open={isAddModalOpen}
        routineId={routineId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => void fetchRoutine({ silent: true })}
      />

      <ConfirmDialog
        open={!!confirmExerciseId}
        title="Remove exercise?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={deletingExerciseId === confirmExerciseId ? "Deleting..." : "Remove"}
        confirmLoading={deletingExerciseId === confirmExerciseId}
        onCancel={() => setConfirmExerciseId(null)}
        onConfirm={async () => {
          if (!confirmExerciseId) return;
          await handleDeleteExercise(confirmExerciseId);
          setConfirmExerciseId(null);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteRoutine}
        title="Delete routine?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={deletingRoutine ? "Deleting..." : "Delete"}
        confirmLoading={deletingRoutine}
        onCancel={() => setConfirmDeleteRoutine(false)}
        onConfirm={handleDeleteRoutine}
      />

      {/* Sticky save/cancel bar */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {anyDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={savingAll || loading}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAndExit()}
              disabled={savingAll || loading}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingAll ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageExercisesClient;
