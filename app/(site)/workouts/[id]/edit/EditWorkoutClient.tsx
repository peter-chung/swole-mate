"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Plus, RotateCcw, Tag, Trash2, X } from "lucide-react";
import Button from "@/app/_components/Button";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import AddWorkoutExerciseModal from "../../_components/AddWorkoutExerciseModal";
import ExerciseSetForm, {
  ExerciseSetDraftValue,
  ExerciseSetFormHandle,
} from "../../_components/ExerciseSetForm";
import {
  getWorkoutExerciseBrandSuggestionsAction,
  updateWorkoutAction,
  updateWorkoutExerciseAction,
} from "../../actions";
import type { WorkoutWithRelations } from "../../_lib/getWorkout";

type EditWorkoutClientProps = {
  workout: WorkoutWithRelations;
};

type WorkoutExerciseWithRelations = NonNullable<
  WorkoutWithRelations["workout_exercises"]
>[number];

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

type ExerciseMetaDraft = {
  equipmentBrand: string;
  notes: string;
};

const buildExerciseMetaDrafts = (
  exercises: WorkoutWithRelations["workout_exercises"] = [],
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

const EditWorkoutClient = ({
  workout: initialWorkout,
}: EditWorkoutClientProps) => {
  const [workout, setWorkout] = useState(initialWorkout);
  const [detailsDraft, setDetailsDraft] = useState<WorkoutDraft>(
    toDraft(initialWorkout),
  );
  const [exerciseMetaDrafts, setExerciseMetaDrafts] = useState(() =>
    buildExerciseMetaDrafts(initialWorkout.workout_exercises),
  );
  const [appliedExerciseMetaDrafts, setAppliedExerciseMetaDrafts] = useState(
    () => buildExerciseMetaDrafts(initialWorkout.workout_exercises),
  );
  const [autoSuggestedSetMap, setAutoSuggestedSetMap] = useState<
    Record<number, boolean>
  >({});
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [pendingDeletedExerciseIds, setPendingDeletedExerciseIds] = useState<
    number[]
  >([]);
  const [pendingAddedExerciseIds, setPendingAddedExerciseIds] = useState<number[]>([]);
  const [editingBrandMap, setEditingBrandMap] = useState<
    Record<number, boolean>
  >({});
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [openActionsExerciseId, setOpenActionsExerciseId] = useState<
    number | null
  >(null);

  const router = useRouter();
  const formRefs = useRef<Record<number, ExerciseSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});
  const pendingDeletedExerciseIdsRef = useRef<number[]>([]);
  const dirtyMapRef = useRef<Record<number, boolean>>({});
  const workoutExercisesRef = useRef<WorkoutWithRelations["workout_exercises"]>([]);

  const workoutId = String(workout.id);
  const detailsDirty =
    detailsDraft.name !== (workout.name ?? "") ||
    detailsDraft.date !== (workout.date ?? "") ||
    detailsDraft.notes !== (workout.notes ?? "");
  const exerciseMetaDirtyIds = useMemo(
    () =>
      (workout.workout_exercises ?? [])
        .filter(
          (we) =>
            (exerciseMetaDrafts[we.id]?.equipmentBrand ?? "") !== (we.equipment_brand ?? "") ||
            (exerciseMetaDrafts[we.id]?.notes ?? "") !== (we.notes ?? ""),
        )
        .map((we) => we.id),
    [exerciseMetaDrafts, workout.workout_exercises],
  );
  const hasExerciseMetaDirty = exerciseMetaDirtyIds.length > 0;

  const anyDirty = Boolean(
    detailsDirty ||
      hasExerciseMetaDirty ||
      pendingDeletedExerciseIds.length > 0 ||
      pendingAddedExerciseIds.length > 0 ||
      workout.workout_exercises?.some((we) => !!dirtyMap[we.id]),
  );

  // Keep refs in sync so fetchWorkout can read current values without
  // needing them in its dependency array (avoids stale closure issues).
  useEffect(() => {
    pendingDeletedExerciseIdsRef.current = pendingDeletedExerciseIds;
  }, [pendingDeletedExerciseIds]);

  useEffect(() => {
    dirtyMapRef.current = dirtyMap;
  }, [dirtyMap]);

  useEffect(() => {
    workoutExercisesRef.current = workout.workout_exercises;
  }, [workout.workout_exercises]);

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

        const fetched = result.data as WorkoutWithRelations;

        const currentExercises = workoutExercisesRef.current ?? [];
        const currentDirtyMap = dirtyMapRef.current;

        const filteredExercises = (fetched.workout_exercises ?? []).map((we) => {
          if (silent && currentDirtyMap[we.id]) {
            const existing = currentExercises.find((e) => e.id === we.id);
            if (existing) return { ...we, exercise_sets: existing.exercise_sets };
          }
          return we;
        });
        const filteredWorkout = { ...fetched, workout_exercises: filteredExercises };

        setWorkout(filteredWorkout);
        setExerciseMetaDrafts(buildExerciseMetaDrafts(filteredExercises));
        setAppliedExerciseMetaDrafts(buildExerciseMetaDrafts(filteredExercises));
        setAutoSuggestedSetMap({});
        setEditingBrandMap({});
        if (!silent) {
          setPendingDeletedExerciseIds([]);
          setDirtyMap({});
        }
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
    setDirtyMap((prev) => {
      const next = { ...prev };
      delete next[workoutExerciseId];
      return next;
    });
    setExerciseMetaDrafts((prev) => {
      const next = { ...prev };
      delete next[workoutExerciseId];
      return next;
    });
    setAppliedExerciseMetaDrafts((prev) => {
      const next = { ...prev };
      delete next[workoutExerciseId];
      return next;
    });
    setAutoSuggestedSetMap((prev) => {
      const next = { ...prev };
      delete next[workoutExerciseId];
      return next;
    });
    setEditingBrandMap((prev) => {
      const next = { ...prev };
      delete next[workoutExerciseId];
      return next;
    });
  }, []);

  const unstageDeleteExercise = useCallback((workoutExerciseId: number) => {
    setPendingDeletedExerciseIds((prev) => prev.filter((id) => id !== workoutExerciseId));
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

  const handleExerciseBrandBlur = useCallback(
    async (workoutExercise: WorkoutExerciseWithRelations) => {
      const equipmentBrand =
        exerciseMetaDrafts[workoutExercise.id]?.equipmentBrand ?? "";
      const appliedEquipmentBrand =
        appliedExerciseMetaDrafts[workoutExercise.id]?.equipmentBrand ?? "";

      if (equipmentBrand === appliedEquipmentBrand) {
        return true;
      }

      const canReplaceSets =
        !dirtyMap[workoutExercise.id] || autoSuggestedSetMap[workoutExercise.id];

      if (!canReplaceSets) {
        setAppliedExerciseMetaDrafts((prev) => ({
          ...prev,
          [workoutExercise.id]: {
            ...prev[workoutExercise.id],
            equipmentBrand,
          },
        }));
        toast.success("Brand updated locally. Existing set edits were kept.");
        return true;
      }

      try {
        const result = await getWorkoutExerciseBrandSuggestionsAction({
          workoutId,
          workoutExerciseId: workoutExercise.id,
          equipmentBrand,
        });

        const normalizedBrand = result.equipmentBrand ?? "";
        setExerciseMetaDrafts((prev) => ({
          ...prev,
          [workoutExercise.id]: {
            ...prev[workoutExercise.id],
            equipmentBrand: normalizedBrand,
          },
        }));
        setAppliedExerciseMetaDrafts((prev) => ({
          ...prev,
          [workoutExercise.id]: {
            ...prev[workoutExercise.id],
            equipmentBrand: normalizedBrand,
          },
        }));

        if (result.sets.length > 0) {
          formRefs.current[workoutExercise.id]?.replaceWithSets(
            result.sets as ExerciseSetDraftValue[],
          );
          setAutoSuggestedSetMap((prev) => ({
            ...prev,
            [workoutExercise.id]: true,
          }));
        }

        const requestedBrand = equipmentBrand.trim();
        const copiedFromBrand = result.copiedFromBrand?.trim();

        if (result.sets.length > 0) {
          if (result.matchedBrand) {
            toast.success(
              requestedBrand
                ? `Using last ${requestedBrand} sets`
                : "Using last unbranded sets",
            );
          } else if (copiedFromBrand) {
            toast.success(
              requestedBrand
                ? `No ${requestedBrand} history found. Using last ${copiedFromBrand} sets`
                : `Using last ${copiedFromBrand} sets`,
            );
          } else {
            toast.success(
              requestedBrand
                ? `No ${requestedBrand} history found. Using last exercise sets`
                : "Using last exercise sets",
            );
          }
        } else {
          toast.success("Brand updated locally. No prior sets found.");
        }
        return true;
      } catch (err) {
        console.error("Error loading exercise brand suggestions:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update brand sets",
        );
        return false;
      }
    },
    [
      appliedExerciseMetaDrafts,
      autoSuggestedSetMap,
      dirtyMap,
      exerciseMetaDrafts,
      workoutId,
    ],
  );

  const openBrandEditor = useCallback((workoutExerciseId: number) => {
    setEditingBrandMap((prev) => ({ ...prev, [workoutExerciseId]: true }));
  }, []);

  const cancelBrandEdit = useCallback((workoutExerciseId: number) => {
    setExerciseMetaDrafts((prev) => ({
      ...prev,
      [workoutExerciseId]: {
        ...prev[workoutExerciseId],
        equipmentBrand:
          appliedExerciseMetaDrafts[workoutExerciseId]?.equipmentBrand ?? "",
      },
    }));
    setEditingBrandMap((prev) => ({ ...prev, [workoutExerciseId]: false }));
  }, [appliedExerciseMetaDrafts]);

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
      if (!deletionFailed) {
        setPendingAddedExerciseIds([]);
      }
      if (deletionFailed) {
        throw new Error("Failed to delete some exercises");
      }

      const exerciseMetaSaves = (workout.workout_exercises ?? [])
        .filter((we) => exerciseMetaDirtyIds.includes(we.id))
        .map((we) =>
          updateWorkoutExerciseAction({
            workoutId,
            workoutExerciseId: we.id,
            equipmentBrand: exerciseMetaDrafts[we.id]?.equipmentBrand ?? "",
            notes: exerciseMetaDrafts[we.id]?.notes ?? "",
            fillPreviousSets: false,
          }),
        );
      await Promise.all(exerciseMetaSaves);

      const saves = (workout.workout_exercises ?? [])
        .filter((we) => !pendingDeletedExerciseIds.includes(we.id))
        .map(async (we) => {
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
    dirtyMap,
    exerciseMetaDirtyIds,
    exerciseMetaDrafts,
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

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionsExerciseId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={`/workouts/${String(workout.id)}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to workout</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Workout
        </h1>
      </header>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : (
        <>
          <section className="mb-6">
            <div className="mb-3">
              <h2 className="text-base font-medium text-gray-900 dark:text-white">
                Workout Details
              </h2>
            </div>

            <div className="-mx-4 px-4 py-4 sm:mx-0 sm:rounded-lg sm:border sm:border-gray-200 sm:bg-white/60 sm:p-6 sm:shadow-sm sm:backdrop-blur-sm sm:dark:border-neutral-800 sm:dark:bg-neutral-900/40">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  id="workoutName"
                  label="Workout Name"
                  type="text"
                  name="name"
                  value={detailsDraft.name}
                  className="!bg-transparent !shadow-none dark:!bg-transparent"
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
                  className="!bg-transparent !shadow-none dark:!bg-transparent"
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
                  rows={2}
                  value={detailsDraft.notes}
                  className="!bg-transparent !shadow-none dark:!bg-transparent"
                  onChange={(e) =>
                    setDetailsDraft((prev) => ({
                      ...prev,
                      notes: (e.target as HTMLTextAreaElement).value,
                    }))
                  }
                  onClear={() => setDetailsDraft((prev) => ({ ...prev, notes: "" }))}
                  containerClassName="sm:col-span-2"
                />
              </div>
            </div>
          </section>

          <section className="mb-3">
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              Exercises
            </h2>
          </section>

          {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
            <div className="-mx-4 divide-y divide-gray-100 dark:divide-neutral-800 sm:mx-0 sm:space-y-4 sm:divide-y-0">
              {workout.workout_exercises.map((we) => {
                const isPendingDeletion = pendingDeletedExerciseIds.includes(we.id);
                return (
                  <div
                    key={we.id}
                    className={`px-4 py-4 transition-opacity sm:rounded-lg sm:border sm:p-5 sm:shadow-sm sm:backdrop-blur-sm ${
                      isPendingDeletion
                        ? "bg-red-50/60 dark:bg-red-950/20 opacity-60 sm:border-red-200 sm:dark:border-red-900/50"
                        : "sm:bg-white/60 sm:dark:bg-neutral-900/40 sm:border-gray-200 sm:dark:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className={`truncate text-sm font-medium ${isPendingDeletion ? "line-through text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
                            {we.exercise?.name ?? "Exercise"}
                          </h3>
                          {isPendingDeletion && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Removed on save
                            </span>
                          )}
                          {!isPendingDeletion && appliedExerciseMetaDrafts[we.id]?.equipmentBrand?.trim() && (
                            <button
                              type="button"
                              onClick={() => openBrandEditor(we.id)}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium leading-tight text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40 dark:hover:bg-blue-500/20"
                            >
                              {appliedExerciseMetaDrafts[we.id]?.equipmentBrand?.trim()}
                            </button>
                          )}
                        </div>
                        {!isPendingDeletion && (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Add a note..."
                              value={exerciseMetaDrafts[we.id]?.notes ?? ""}
                              onChange={(e) =>
                                setExerciseMetaDrafts((prev) => ({
                                  ...prev,
                                  [we.id]: { ...prev[we.id], notes: e.target.value },
                                }))
                              }
                              className="w-full bg-transparent text-xs text-gray-400 placeholder-gray-300 outline-none border-b border-transparent focus:border-[#3ecf8e] pb-0.5 pr-5 transition-colors dark:text-gray-500 dark:placeholder-gray-600 dark:focus:border-[#3ecf8e]"
                            />
                            {exerciseMetaDrafts[we.id]?.notes && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExerciseMetaDrafts((prev) => ({
                                    ...prev,
                                    [we.id]: { ...prev[we.id], notes: "" },
                                  }))
                                }
                                aria-label="Clear note"
                                className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-300 transition-colors hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isPendingDeletion ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => unstageDeleteExercise(we.id)}
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
                              setOpenActionsExerciseId((prev) =>
                                prev === we.id ? null : we.id,
                              )
                            }
                            disabled={loading}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                            aria-label="Exercise actions"
                            aria-haspopup="menu"
                            aria-expanded={openActionsExerciseId === we.id}
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {openActionsExerciseId === we.id && (
                            <div
                              className="absolute right-0 top-9 z-20 min-w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenActionsExerciseId(null);
                                  openBrandEditor(we.id);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-neutral-800"
                              >
                                <Tag className="h-4 w-4" aria-hidden="true" />
                                <span>
                                  {appliedExerciseMetaDrafts[we.id]?.equipmentBrand?.trim()
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
                                  stageDeleteExercise(we.id);
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
                    {!isPendingDeletion && editingBrandMap[we.id] && (
                      <div className="mt-2 max-w-sm space-y-2">
                        <InputField
                          id={`workout-exercise-brand-${we.id}`}
                          label="Equipment Brand"
                          type="text"
                          placeholder="Optional, e.g., Hammer Strength"
                          value={exerciseMetaDrafts[we.id]?.equipmentBrand ?? ""}
                          onChange={(e) => {
                            const value = (e.target as HTMLInputElement).value;
                            setExerciseMetaDrafts((prev) => ({
                              ...prev,
                              [we.id]: { ...prev[we.id], equipmentBrand: value },
                            }));
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              const applied = await handleExerciseBrandBlur(we);
                              if (applied) {
                                setEditingBrandMap((prev) => ({ ...prev, [we.id]: false }));
                              }
                            }}
                          >
                            Apply
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelBrandEdit(we.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isPendingDeletion && (
                      <div className="mt-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
                        <ExerciseSetForm
                          workoutId={workoutId}
                          workoutExerciseId={we.id}
                          exerciseSets={we.exercise_sets ?? []}
                          exerciseType={we.exercise ?? null}
                          onSaved={() => void fetchWorkout({ silent: true })}
                          onDirtyChange={(dirty) =>
                            setDirtyMap((prev) => ({ ...prev, [we.id]: dirty }))
                          }
                          onManualEdit={() =>
                            setAutoSuggestedSetMap((prev) => ({ ...prev, [we.id]: false }))
                          }
                          ref={(handle) => {
                            formRefs.current[we.id] = handle;
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

      <AddWorkoutExerciseModal
        open={isAddModalOpen}
        workoutId={workoutId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newId) => {
          setPendingAddedExerciseIds((prev) => [...prev, newId]);
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
          void (async () => {
            if (pendingAddedExerciseIds.length > 0) {
              await Promise.allSettled(
                pendingAddedExerciseIds.map((id) => persistDeleteExercise(id)),
              );
            }
            router.push(`/workouts/${String(workout.id)}`);
          })();
        }}
      />

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
              onClick={handleCancel}
              disabled={savingAll || loading}
            >
              Cancel
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

export default EditWorkoutClient;
