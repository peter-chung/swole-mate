"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Plus, RotateCcw, Tag, Trash2 } from "lucide-react";
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
import Button from "@/app/_components/Button";

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
  notes: string;
};

const buildExerciseMetaDrafts = (
  exercises: RoutineWithRelations["routine_exercises"] = [],
) =>
  (exercises ?? []).reduce<Record<number, ExerciseMetaDraft>>(
    (acc, exercise) => {
      acc[exercise.id] = {
        equipmentBrand: exercise.equipment_brand ?? "",
        notes: exercise.notes ?? "",
      };
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
  const [appliedExerciseMetaDrafts, setAppliedExerciseMetaDrafts] = useState(() =>
    buildExerciseMetaDrafts(initialRoutine.routine_exercises),
  );
  const [editingBrandMap, setEditingBrandMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [confirmExerciseId, setConfirmExerciseId] = useState<number | null>(null);
  const [pendingDeletedExerciseIds, setPendingDeletedExerciseIds] = useState<number[]>([]);
  const [pendingAddedExerciseIds, setPendingAddedExerciseIds] = useState<number[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [openActionsExerciseId, setOpenActionsExerciseId] = useState<number | null>(null);

  const formRefs = useRef<Record<number, RoutineSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});
  const pendingDeletedExerciseIdsRef = useRef<number[]>([]);
  const dirtyMapRef = useRef<Record<number, boolean>>({});
  const routineExercisesRef = useRef<RoutineWithRelations["routine_exercises"]>([]);

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
            (exerciseMetaDrafts[re.id]?.equipmentBrand ?? "") !== (re.equipment_brand ?? "") ||
            (exerciseMetaDrafts[re.id]?.notes ?? "") !== (re.notes ?? ""),
        )
        .map((re) => re.id),
    [exerciseMetaDrafts, routine.routine_exercises],
  );

  const anyDirty = Boolean(
    detailsDirty ||
      pendingDeletedExerciseIds.length > 0 ||
      pendingAddedExerciseIds.length > 0 ||
      exerciseMetaDirtyIds.length > 0 ||
      routine.routine_exercises?.some((re) => !!dirtyMap[re.id]),
  );

  // Keep refs in sync so fetchRoutine can read current values in async context
  useEffect(() => {
    pendingDeletedExerciseIdsRef.current = pendingDeletedExerciseIds;
  }, [pendingDeletedExerciseIds]);

  useEffect(() => {
    dirtyMapRef.current = dirtyMap;
  }, [dirtyMap]);

  useEffect(() => {
    routineExercisesRef.current = routine.routine_exercises;
  }, [routine.routine_exercises]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!anyDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  useEffect(() => {
    if (openActionsExerciseId == null) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest("[data-exercise-actions-menu]"))
        setOpenActionsExerciseId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenActionsExerciseId(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionsExerciseId]);

  const fetchRoutine = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        if (!silent) setLoading(true);
        const res = await fetch(`/api/routines/${encodeURIComponent(routineId)}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        const fetched = result.data as RoutineWithRelations;

        const currentExercises = routineExercisesRef.current ?? [];
        const currentDirtyMap = dirtyMapRef.current;

        const filteredExercises = (fetched.routine_exercises ?? []).map((re) => {
          if (silent && currentDirtyMap[re.id]) {
            const existing = currentExercises.find((e) => e.id === re.id);
            if (existing) return { ...re, routine_sets: existing.routine_sets };
          }
          return re;
        });

        setRoutine({ ...fetched, routine_exercises: filteredExercises });
        setExerciseMetaDrafts(buildExerciseMetaDrafts(filteredExercises));
        setAppliedExerciseMetaDrafts(buildExerciseMetaDrafts(filteredExercises));
        setEditingBrandMap({});
        setOpenActionsExerciseId(null);
        if (!silent) {
          setPendingDeletedExerciseIds([]);
          setDirtyMap({});
        }
      } catch (err) {
        console.error("Error fetching routine:", err);
        toast.error(err instanceof Error ? err.message : "Failed to refresh routine");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [routineId],
  );

  const stageDeleteExercise = useCallback((routineExerciseId: number) => {
    if (!routineExerciseId) return;
    setPendingDeletedExerciseIds((prev) =>
      prev.includes(routineExerciseId) ? prev : [...prev, routineExerciseId],
    );
    setDirtyMap((prev) => {
      const next = { ...prev };
      delete next[routineExerciseId];
      return next;
    });
    setExerciseMetaDrafts((prev) => {
      const next = { ...prev };
      delete next[routineExerciseId];
      return next;
    });
    setAppliedExerciseMetaDrafts((prev) => {
      const next = { ...prev };
      delete next[routineExerciseId];
      return next;
    });
    setEditingBrandMap((prev) => {
      const next = { ...prev };
      delete next[routineExerciseId];
      return next;
    });
    setOpenActionsExerciseId(null);
  }, []);

  const unstageDeleteExercise = useCallback((routineExerciseId: number) => {
    setPendingDeletedExerciseIds((prev) => prev.filter((id) => id !== routineExerciseId));
  }, []);

  const openBrandEditor = useCallback((routineExerciseId: number) => {
    setEditingBrandMap((prev) => ({ ...prev, [routineExerciseId]: true }));
  }, []);

  const cancelBrandEdit = useCallback((routineExerciseId: number) => {
    setExerciseMetaDrafts((prev) => ({
      ...prev,
      [routineExerciseId]: {
        ...prev[routineExerciseId],
        equipmentBrand: appliedExerciseMetaDrafts[routineExerciseId]?.equipmentBrand ?? "",
      },
    }));
    setEditingBrandMap((prev) => ({ ...prev, [routineExerciseId]: false }));
  }, [appliedExerciseMetaDrafts]);

  const applyBrandEdit = useCallback((routineExerciseId: number) => {
    const brand = exerciseMetaDrafts[routineExerciseId]?.equipmentBrand ?? "";
    setAppliedExerciseMetaDrafts((prev) => ({
      ...prev,
      [routineExerciseId]: { ...prev[routineExerciseId], equipmentBrand: brand },
    }));
    setEditingBrandMap((prev) => ({ ...prev, [routineExerciseId]: false }));
  }, [exerciseMetaDrafts]);

  const persistDeleteExercise = useCallback(
    async (routineExerciseId: number) => {
      await deleteRoutineExerciseAction({ routineId, routineExerciseId });
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

      // Persist staged exercise deletions
      const deletedIdsToPersist = [...pendingDeletedExerciseIds];
      const deleteResults = await Promise.allSettled(
        deletedIdsToPersist.map((id) => persistDeleteExercise(id)),
      );
      const deleteFailed = deleteResults.some((r) => r.status === "rejected");
      if (!deleteFailed) {
        setPendingDeletedExerciseIds([]);
        setPendingAddedExerciseIds([]);
      }

      const exerciseMetaSaves = (routine.routine_exercises ?? [])
        .filter((re) => exerciseMetaDirtyIds.includes(re.id) && !pendingDeletedExerciseIds.includes(re.id))
        .map((re) =>
          updateRoutineExerciseAction({
            routineId,
            routineExerciseId: re.id,
            equipmentBrand: exerciseMetaDrafts[re.id]?.equipmentBrand ?? "",
            notes: exerciseMetaDrafts[re.id]?.notes ?? "",
          }),
        );
      await Promise.all(exerciseMetaSaves);

      const setsSaves = (routine.routine_exercises ?? [])
        .filter((re) => !pendingDeletedExerciseIds.includes(re.id))
        .map(async (re) => {
          const handle = formRefs.current[re.id];
          if (handle?.save) await handle.save({ silent: true });
        });
      await Promise.all(setsSaves);

      if (deleteFailed) throw new Error("Failed to remove some exercises");

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
  }, [detailsDirty, detailsDraft, exerciseMetaDirtyIds, exerciseMetaDrafts, fetchRoutine, pendingDeletedExerciseIds, persistDeleteExercise, routine.routine_exercises, routineId]);

  const handleSaveAndExit = useCallback(async () => {
    const ok = await handleSaveAll();
    if (ok) router.push(`/routines/${routineId}`);
  }, [handleSaveAll, router, routineId]);

  const handleCancel = useCallback(async () => {
    if (pendingAddedExerciseIds.length > 0) {
      setCancelling(true);
      await Promise.allSettled(
        pendingAddedExerciseIds.map((id) => persistDeleteExercise(id)),
      );
      setCancelling(false);
    }
    router.push(`/routines/${routineId}`);
  }, [pendingAddedExerciseIds, persistDeleteExercise, routineId, router]);


  return (
    <div className="mx-auto max-w-2xl px-4 pb-36 sm:pb-24 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={`/routines/${routineId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to routine</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Routine
        </h1>
      </header>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : (
        <>
          {/* Details */}
          <section className="mb-6">
            <div className="mb-3">
              <h2 className="text-base font-medium text-gray-900 dark:text-white">
                Routine Details
              </h2>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/40 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  id="routineName"
                  label="Routine Name"
                  type="text"
                  value={detailsDraft.name}
                  className="!bg-transparent !shadow-none dark:!bg-transparent"
                  onChange={(e) =>
                    setDetailsDraft((p) => ({ ...p, name: (e.target as HTMLInputElement).value }))
                  }
                />
                <InputField
                  id="routineDate"
                  label="Date"
                  type="date"
                  value={detailsDraft.date}
                  className="!bg-transparent !shadow-none dark:!bg-transparent"
                  onChange={(e) =>
                    setDetailsDraft((p) => ({ ...p, date: (e.target as HTMLInputElement).value }))
                  }
                />
                <TextAreaField
                  id="routineNotes"
                  label="Notes"
                  placeholder="Optional notes about this routine"
                  value={detailsDraft.notes}
                  rows={2}
                  className="!bg-transparent !shadow-none dark:!bg-transparent"
                  containerClassName="sm:col-span-2"
                  onChange={(e) =>
                    setDetailsDraft((p) => ({ ...p, notes: (e.target as HTMLTextAreaElement).value }))
                  }
                />
              </div>
            </div>
          </section>

          {/* Exercises */}
          <section className="mb-3">
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              Exercises
            </h2>
          </section>

          {routine.routine_exercises && routine.routine_exercises.filter((re) => !pendingDeletedExerciseIds.includes(re.id)).length > 0 ? (
            <div className="space-y-4">
              {routine.routine_exercises.map((re) => {
                const isPendingDeletion = pendingDeletedExerciseIds.includes(re.id);
                return (
                  <div
                    key={re.id}
                    className={`rounded-lg border p-4 shadow-sm backdrop-blur-sm sm:p-5 transition-opacity ${
                      isPendingDeletion
                        ? "border-red-200 bg-red-50/60 opacity-60 dark:border-red-900/50 dark:bg-red-950/20"
                        : "border-gray-200 bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className={`truncate text-sm font-medium ${isPendingDeletion ? "line-through text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
                            {re.exercise?.name ?? (re.custom_exercise_id ? "Custom" : "Exercise")}
                          </h3>
                          {isPendingDeletion && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Removed on save
                            </span>
                          )}
                          {!isPendingDeletion && appliedExerciseMetaDrafts[re.id]?.equipmentBrand?.trim() && (
                            <button
                              type="button"
                              onClick={() => openBrandEditor(re.id)}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium leading-tight text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40 dark:hover:bg-blue-500/20"
                            >
                              {appliedExerciseMetaDrafts[re.id]?.equipmentBrand?.trim()}
                            </button>
                          )}
                        </div>
                        {!isPendingDeletion && (
                          <input
                            type="text"
                            placeholder="Add a note..."
                            value={exerciseMetaDrafts[re.id]?.notes ?? ""}
                            onChange={(e) =>
                              setExerciseMetaDrafts((prev) => ({
                                ...prev,
                                [re.id]: { ...prev[re.id], notes: e.target.value },
                              }))
                            }
                            className="w-full bg-transparent text-xs text-gray-400 placeholder-gray-300 outline-none border-b border-transparent focus:border-gray-300 pb-0.5 transition-colors dark:text-gray-500 dark:placeholder-gray-600 dark:focus:border-gray-600"
                          />
                        )}
                      </div>
                      {isPendingDeletion ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => unstageDeleteExercise(re.id)}
                          className="gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Undo
                        </Button>
                      ) : (
                        <div className="relative shrink-0" data-exercise-actions-menu>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionsExerciseId((prev) => prev === re.id ? null : re.id)
                            }
                            disabled={loading}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                            aria-label="Exercise actions"
                            aria-haspopup="menu"
                            aria-expanded={openActionsExerciseId === re.id}
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {openActionsExerciseId === re.id && (
                            <div
                              className="absolute right-0 top-9 z-20 min-w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenActionsExerciseId(null);
                                  openBrandEditor(re.id);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-neutral-800"
                              >
                                <Tag className="h-4 w-4" aria-hidden="true" />
                                <span>
                                  {appliedExerciseMetaDrafts[re.id]?.equipmentBrand?.trim()
                                    ? "Edit brand"
                                    : "Set brand"}
                                </span>
                              </button>
                              <div className="my-1 h-px bg-gray-200 dark:bg-neutral-700" />
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenActionsExerciseId(null);
                                  setConfirmExerciseId(re.id);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                <span>Remove exercise</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!isPendingDeletion && editingBrandMap[re.id] && (
                      <div className="mt-2 max-w-sm space-y-2">
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
                              [re.id]: { ...prev[re.id], equipmentBrand: value },
                            }));
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => applyBrandEdit(re.id)}
                          >
                            Apply
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelBrandEdit(re.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isPendingDeletion && (
                      <div className="mt-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
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
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-neutral-700 dark:text-gray-400">
              No exercises yet. Add your first exercise below.
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 w-full gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </>
      )}

      <AddRoutineExerciseModal
        open={isAddModalOpen}
        routineId={routineId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newId) => {
          setPendingAddedExerciseIds((prev) => [...prev, newId]);
          void fetchRoutine({ silent: true });
        }}
      />

      <ConfirmDialog
        open={!!confirmExerciseId}
        title="Remove exercise?"
        description="The exercise will be removed when you save."
        destructive
        confirmLabel="Remove"
        onCancel={() => setConfirmExerciseId(null)}
        onConfirm={() => {
          if (!confirmExerciseId) return;
          stageDeleteExercise(confirmExerciseId);
          setConfirmExerciseId(null);
        }}
      />

      {/* Sticky save/cancel bar */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <span className={`text-sm ${anyDirty ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
            {anyDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleCancel()}
              disabled={savingAll || loading || cancelling}
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={savingAll}
              disabled={loading}
              onClick={() => void handleSaveAndExit()}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageExercisesClient;
