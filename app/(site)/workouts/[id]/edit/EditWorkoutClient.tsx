"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  GripVertical,
  Loader2,
  MoreVertical,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Button from "@/app/_components/Button";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useDebounce, useNetworkState } from "react-use";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import SortableListItem from "@/app/_components/SortableListItem";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddWorkoutExerciseModal from "../../_components/AddWorkoutExerciseModal";
import ExerciseSetForm, {
  ExerciseSetDraftValue,
  ExerciseSetFormHandle,
} from "../../_components/ExerciseSetForm";
import {
  getWorkoutExerciseBrandSuggestionsAction,
  reorderWorkoutExercisesAction,
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
  type AutosaveState = "idle" | "saving" | "saved" | "error";
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("saved");
  const [showSavingIndicator, setShowSavingIndicator] = useState(false);
  const [editingBrandMap, setEditingBrandMap] = useState<
    Record<number, boolean>
  >({});
  const [openActionsExerciseId, setOpenActionsExerciseId] = useState<
    number | null
  >(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [reorderSaving, setReorderSaving] = useState(false);
  const isAnyDragActive = activeDragId !== null;

  const router = useRouter();
  const formRefs = useRef<Record<number, ExerciseSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});
  const dirtyMapRef = useRef<Record<number, boolean>>({});
  const workoutExercisesRef = useRef<WorkoutWithRelations["workout_exercises"]>([]);
  const detailsDraftRef = useRef<WorkoutDraft>(detailsDraft);
  const detailsDirtyRef = useRef(false);
  const exerciseMetaDraftsRef = useRef(exerciseMetaDrafts);
  const exerciseMetaDirtyIdsRef = useRef<number[]>([]);
  const anyDirtyRef = useRef(false);
  const autosaveInFlightRef = useRef(false);
  const autosaveQueuedRef = useRef(false);
  const cancelAutosaveDebounceRef = useRef<() => void>(() => {});

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
  const sortedExercises = useMemo(
    () =>
      (workout.workout_exercises ?? [])
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [workout.workout_exercises],
  );

  const anyDirty = Boolean(
    detailsDirty ||
      hasExerciseMetaDirty ||
      workout.workout_exercises?.some((we) => !!dirtyMap[we.id]),
  );

  // Keep refs in sync so fetchWorkout can read current values without
  // needing them in its dependency array (avoids stale closure issues).
  useEffect(() => {
    dirtyMapRef.current = dirtyMap;
  }, [dirtyMap]);

  useEffect(() => {
    workoutExercisesRef.current = workout.workout_exercises;
  }, [workout.workout_exercises]);

  useEffect(() => {
    detailsDraftRef.current = detailsDraft;
  }, [detailsDraft]);

  useEffect(() => {
    detailsDirtyRef.current = detailsDirty;
  }, [detailsDirty]);

  useEffect(() => {
    exerciseMetaDraftsRef.current = exerciseMetaDrafts;
  }, [exerciseMetaDrafts]);

  useEffect(() => {
    exerciseMetaDirtyIdsRef.current = exerciseMetaDirtyIds;
  }, [exerciseMetaDirtyIds]);

  useEffect(() => {
    anyDirtyRef.current = anyDirty;
  }, [anyDirty]);

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

  const handleDeleteExercise = useCallback(
    async (workoutExerciseId: number) => {
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
      delete formRefs.current[workoutExerciseId];

      try {
        await persistDeleteExercise(workoutExerciseId);
        toast.success("Exercise removed");
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete exercise",
        );
        await fetchWorkout({ silent: false });
      }
    },
    [fetchWorkout, persistDeleteExercise],
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

  const sensors = useSensors(
    // Delay (not distance) activation: a touch that starts on the handle but
    // moves quickly (a scroll-through) is released back to native scrolling
    // before the delay elapses, instead of hijacking the scroll into a drag.
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id));
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedExercises.findIndex((we) => we.id === active.id);
      const newIndex = sortedExercises.findIndex((we) => we.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedExercises, oldIndex, newIndex);

      setWorkout((prev) => ({
        ...prev,
        workout_exercises: reordered.map((we, index) => ({
          ...we,
          order_index: index + 1,
        })),
      }));

      setReorderSaving(true);
      try {
        await reorderWorkoutExercisesAction({
          workoutId,
          orderedWorkoutExerciseIds: reordered.map((we) => we.id),
        });
        toast.success("Exercise order updated", { duration: 1500 });
      } catch (err) {
        console.error(err);
        toast.error("Failed to reorder exercises. Refreshed to latest order.");
        await fetchWorkout({ silent: true });
      } finally {
        setReorderSaving(false);
      }
    },
    [sortedExercises, workoutId, fetchWorkout],
  );

  type PersistResult = { ok: true } | { ok: false; message: string };

  const runPersist = useCallback(async (): Promise<PersistResult> => {
    const workoutExercises = workoutExercisesRef.current ?? [];

    if (!anyDirtyRef.current && !workoutExercises.length) {
      return { ok: true };
    }

    try {
      if (detailsDirtyRef.current) {
        const draft = detailsDraftRef.current;
        const trimmedName = draft.name.trim();
        if (!trimmedName) {
          throw new Error("Workout name is required");
        }
        if (!draft.date) {
          throw new Error("Workout date is required");
        }

        const payload = {
          name: trimmedName,
          date: draft.date,
          notes: draft.notes,
        };

        await updateWorkoutAction(workoutId, payload);
        setDetailsDraft({
          name: payload.name,
          date: payload.date,
          notes: payload.notes ?? "",
        });
      }

      const exerciseMetaDrafts = exerciseMetaDraftsRef.current;
      const exerciseMetaDirtyIds = exerciseMetaDirtyIdsRef.current;
      const exerciseMetaSaves = workoutExercises
        .filter((we) => exerciseMetaDirtyIds.includes(we.id))
        .map((we) =>
          updateWorkoutExerciseAction({
            workoutId,
            workoutExerciseId: we.id,
            equipmentBrand: exerciseMetaDrafts[we.id]?.equipmentBrand ?? "",
            notes: exerciseMetaDrafts[we.id]?.notes ?? "",
            // autosave must never trigger the expensive fillPreviousSets path
            fillPreviousSets: false,
          }),
        );
      await Promise.all(exerciseMetaSaves);

      const saves = workoutExercises.map(async (we) => {
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

      const shouldRefetch =
        detailsDirtyRef.current || exerciseMetaDirtyIds.length > 0;
      if (shouldRefetch) {
        await fetchWorkout({ silent: true });
      }

      return { ok: true };
    } catch (err) {
      console.error(err);
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to save some changes",
      };
    }
  }, [fetchWorkout, workoutId]);

  const triggerAutosave = useCallback(async () => {
    if (autosaveInFlightRef.current) {
      autosaveQueuedRef.current = true;
      return;
    }
    autosaveInFlightRef.current = true;
    setAutosaveState("saving");
    try {
      const result = await runPersist();
      if (result.ok) {
        setAutosaveState("saved");
      } else {
        setAutosaveState("error");
        toast.error(result.message);
      }
    } finally {
      autosaveInFlightRef.current = false;
      if (autosaveQueuedRef.current) {
        autosaveQueuedRef.current = false;
        void triggerAutosave();
      }
    }
  }, [runPersist]);

  const handleBack = useCallback(async () => {
    cancelAutosaveDebounceRef.current();
    if (anyDirtyRef.current) {
      await triggerAutosave();
    }
    router.push(`/workouts/${String(workout.id)}`);
  }, [router, triggerAutosave, workout.id]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!anyDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  const [, cancelAutosaveDebounce] = useDebounce(
    () => {
      if (!anyDirty) return;
      void triggerAutosave();
    },
    3000,
    [detailsDraft, exerciseMetaDrafts, dirtyMap],
  );
  useEffect(() => {
    cancelAutosaveDebounceRef.current = cancelAutosaveDebounce;
  }, [cancelAutosaveDebounce]);

  useEffect(() => {
    const flushOnHide = () => {
      if (document.visibilityState === "hidden") {
        cancelAutosaveDebounceRef.current();
        if (anyDirtyRef.current) void triggerAutosave();
      }
    };
    const flushOnPageHide = () => {
      cancelAutosaveDebounceRef.current();
      if (anyDirtyRef.current) void triggerAutosave();
    };
    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushOnHide);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [triggerAutosave]);

  const { online } = useNetworkState();
  const prevOnlineRef = useRef(online);
  useEffect(() => {
    if (online && !prevOnlineRef.current && autosaveState === "error") {
      void triggerAutosave();
    }
    prevOnlineRef.current = online;
  }, [online, autosaveState, triggerAutosave]);

  useEffect(() => {
    if (autosaveState !== "saving") {
      setShowSavingIndicator(false);
      return;
    }
    const timer = setTimeout(() => setShowSavingIndicator(true), 400);
    return () => clearTimeout(timer);
  }, [autosaveState]);

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
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <button
            type="button"
            onClick={() => void handleBack()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to workout</span>
          </button>
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

          {sortedExercises.length > 0 ? (
            <DndContext
              id="workout-exercises-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragCancel={handleDragCancel}
              onDragEnd={(event) => void handleDragEnd(event)}
            >
              <SortableContext
                items={sortedExercises.map((we) => we.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="-mx-4 divide-y divide-gray-100 dark:divide-neutral-800 sm:mx-0 sm:space-y-4 sm:divide-y-0">
                  {sortedExercises.map((we) => (
                    <SortableListItem key={we.id} id={we.id}>
                      {({ setNodeRef, style, dragHandleProps, isDragging }) => (
                        <div
                          ref={setNodeRef}
                          style={style}
                          className={`px-4 py-4 sm:rounded-lg sm:border sm:p-5 sm:shadow-sm sm:backdrop-blur-sm sm:bg-white/60 sm:dark:bg-neutral-900/40 sm:border-gray-200 sm:dark:border-neutral-800${isDragging ? " relative z-10 shadow-md" : ""}`}
                        >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {sortedExercises.length > 1 && (
                          <button
                            type="button"
                            {...dragHandleProps}
                            disabled={reorderSaving}
                            aria-label={`Drag to reorder ${we.exercise?.name ?? "exercise"}`}
                            className="mt-0.5 inline-flex h-8 w-8 shrink-0 touch-none select-none [-webkit-touch-callout:none] cursor-grab items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
                          >
                            <GripVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="truncate select-none text-sm font-medium text-gray-900 [-webkit-touch-callout:none] dark:text-white">
                            {we.exercise?.name ?? "Exercise"}
                          </h3>
                          {appliedExerciseMetaDrafts[we.id]?.equipmentBrand?.trim() && (
                            <button
                              type="button"
                              onClick={() => openBrandEditor(we.id)}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium leading-tight text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40 dark:hover:bg-blue-500/20"
                            >
                              {appliedExerciseMetaDrafts[we.id]?.equipmentBrand?.trim()}
                            </button>
                          )}
                        </div>
                        {!isAnyDragActive && (
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
                            className="w-full bg-transparent text-base text-gray-400 placeholder-gray-300 outline-none border-b border-transparent focus:border-[#3ecf8e] pb-0.5 pr-5 transition-colors dark:text-gray-500 dark:placeholder-gray-600 dark:focus:border-[#3ecf8e] sm:text-xs"
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
                      </div>
                      {!isAnyDragActive && (
                      <div className="relative shrink-0" data-exercise-actions-menu>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionsExerciseId((prev) =>
                              prev === we.id ? null : we.id,
                            )
                          }
                          disabled={loading}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                          aria-label="Exercise actions"
                          aria-haspopup="menu"
                          aria-expanded={openActionsExerciseId === we.id}
                        >
                          <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {openActionsExerciseId === we.id && (
                          <div
                            className="absolute right-0 top-11 z-20 min-w-56 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:min-w-40"
                            role="menu"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenActionsExerciseId(null);
                                openBrandEditor(we.id);
                              }}
                              className="flex w-full items-center gap-2 rounded px-3 py-3 text-left text-base text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-neutral-800 sm:gap-1.5 sm:px-2 sm:py-1.5 sm:text-sm"
                            >
                              <Tag className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
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
                                void handleDeleteExercise(we.id);
                              }}
                              className="flex w-full items-center gap-2 rounded px-3 py-3 text-left text-base text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 sm:gap-1.5 sm:px-2 sm:py-1.5 sm:text-sm"
                            >
                              <Trash2 className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
                              <span>Remove exercise</span>
                            </button>
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                    {!isAnyDragActive && editingBrandMap[we.id] && (
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
                          onClear={() =>
                            setExerciseMetaDrafts((prev) => ({
                              ...prev,
                              [we.id]: { ...prev[we.id], equipmentBrand: "" },
                            }))
                          }
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
                    {!isAnyDragActive && (
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
                      )}
                    </SortableListItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => void handleBack()}
            disabled={loading}
            className="mt-3 w-full gap-1.5"
          >
            {showSavingIndicator ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save & Exit
          </Button>
        </>
      )}

      <AddWorkoutExerciseModal
        open={isAddModalOpen}
        workoutId={workoutId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => void fetchWorkout({ silent: true })}
      />

    </div>
  );
};

export default EditWorkoutClient;
