"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database.types";
import { toast } from "react-hot-toast";
import {
  deleteExerciseSetAction,
  saveExerciseSetAction,
} from "../actions";

type ExerciseSet = Tables<"exercise_sets">;

export type ExerciseSetDraftValue = Pick<
  ExerciseSet,
  "set_number" | "reps" | "weight" | "duration" | "distance" | "notes"
>;

export type ExerciseSetFormHandle = {
  // Imperatively save this form's sets
  save: (opts?: { silent?: boolean }) => Promise<void>;
  replaceWithSets: (nextSets: ExerciseSetDraftValue[]) => void;
};

type ExerciseTypeFlags = {
  has_weight: boolean | null;
  has_reps: boolean | null;
  has_duration: boolean | null;
  has_distance: boolean | null;
  is_bodyweight: boolean | null;
};

type Props = {
  workoutId: string;
  workoutExerciseId: number;
  exerciseSets: Array<
    Pick<
      ExerciseSet,
      | "id"
      | "set_number"
      | "reps"
      | "weight"
      | "duration"
      | "distance"
      | "notes"
    >
  >;
  exerciseType?: ExerciseTypeFlags | null;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onManualEdit?: () => void;
};

type LocalSet = {
  id: number | string; // number for persisted, string for local new (e.g., "new-<ts>")
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: string | null;
  distance: number | null;
  notes: string | null;
  _status?: "clean" | "dirty" | "new" | "saving";
};

type ApiExerciseSet = {
  id: number;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: unknown | null;
  distance: number | null;
  notes: string | null;
};

const ExerciseSetForm = forwardRef<ExerciseSetFormHandle, Props>(
  (
    {
      workoutId,
      workoutExerciseId,
      exerciseSets,
      exerciseType,
      onSaved,
      onDirtyChange,
      onManualEdit,
    },
    ref
  ) => {
    const [sets, setSets] = useState<LocalSet[]>([]);
    const [deletedSetIds, setDeletedSetIds] = useState<number[]>([]);
    const [referenceSets, setReferenceSets] = useState<ExerciseSetDraftValue[]>([]);
    const lastDirtyRef = useRef<boolean>(false);
    const dirtyCallbackRef = useRef<Props["onDirtyChange"]>(undefined);

    useEffect(() => {
      dirtyCallbackRef.current = onDirtyChange;
    }, [onDirtyChange]);

    useEffect(() => {
      const normalized: LocalSet[] = (exerciseSets ?? [])
        .slice()
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          id: s.id,
          set_number: s.set_number,
          reps: s.reps ?? null,
          weight: s.weight ?? null,
          duration:
            typeof s.duration === "string"
              ? s.duration
              : s.duration != null
              ? String(s.duration)
              : null,
          distance: s.distance ?? null,
          notes: s.notes ?? null,
          _status: "clean",
        }));

      setSets((prev) => {
        const sameLength = prev.length === normalized.length;
        const isSame =
          sameLength &&
          prev.every((cur, i) => {
            const next = normalized[i];
            return (
              cur.id === next.id &&
              cur.set_number === next.set_number &&
              cur.reps === next.reps &&
              cur.weight === next.weight &&
              cur.duration === next.duration &&
              cur.distance === next.distance &&
              cur.notes === next.notes
            );
          });

        if (isSame) return prev;

        if (lastDirtyRef.current) {
          lastDirtyRef.current = false;
          const callback = dirtyCallbackRef.current;
          if (typeof callback === "function") callback(false);
        }

        return normalized;
      });
      setDeletedSetIds([]);
      setReferenceSets(
        normalized
          .filter((s) => s.weight != null || s.reps != null)
          .map((s) => ({
            set_number: s.set_number,
            weight: s.weight,
            reps: s.reps,
            duration: s.duration,
            distance: s.distance,
            notes: s.notes,
          }))
      );
    }, [exerciseSets]);

    // Report dirty-state to parent when it changes
    useEffect(() => {
      const hasDirty =
        sets.some((s) => s._status === "dirty" || s._status === "new") ||
        deletedSetIds.length > 0;
      if (lastDirtyRef.current !== hasDirty) {
        lastDirtyRef.current = hasDirty;
        const callback = dirtyCallbackRef.current;
        if (typeof callback === "function") callback(hasDirty);
      }
    }, [deletedSetIds.length, sets]);

    const onChangeField = (
      idx: number,
      field: keyof Pick<LocalSet, "reps" | "weight" | "duration" | "distance" | "notes">,
      value: string
    ) => {
      onManualEdit?.();
      setSets((prev) => {
        const copy = [...prev];
        const current = copy[idx];
        if (!current) return prev;
        const markDirty =
          current._status === "clean" ? "dirty" : current._status ?? "dirty";

        if (field === "notes") {
          copy[idx] = { ...current, notes: value === "" ? null : value, _status: markDirty };
        } else if (field === "reps") {
          const n = value === "" ? null : Number(value);
          copy[idx] = { ...current, reps: n === null || Number.isNaN(n) ? null : n, _status: markDirty };
        } else if (field === "weight") {
          const n = value === "" ? null : Number(value);
          copy[idx] = { ...current, weight: n === null || Number.isNaN(n) ? null : n, _status: markDirty };
        } else if (field === "duration") {
          copy[idx] = { ...current, duration: value === "" ? null : value, _status: markDirty };
        } else if (field === "distance") {
          const n = value === "" ? null : Number(value);
          copy[idx] = { ...current, distance: n === null || Number.isNaN(n) ? null : n, _status: markDirty };
        }
        return copy;
      });
    };

    const hasMeaningfulValue = (set: LocalSet) => {
      const durationValue =
        typeof set.duration === "string" ? set.duration.trim() : null;
      const notesValue =
        typeof set.notes === "string" ? set.notes.trim() : null;
      return (
        set.reps !== null ||
        set.weight !== null ||
        set.distance !== null ||
        (durationValue && durationValue.length > 0) ||
        (notesValue && notesValue.length > 0)
      );
    };

    const normalizeApiSet = (apiSet: ApiExerciseSet): LocalSet => ({
      id: apiSet.id,
      set_number: apiSet.set_number,
      reps: apiSet.reps ?? null,
      weight: apiSet.weight ?? null,
      duration:
        apiSet.duration == null
          ? null
          : typeof apiSet.duration === "string"
          ? apiSet.duration
          : String(apiSet.duration),
      distance: apiSet.distance ?? null,
      notes: apiSet.notes ?? null,
      _status: "clean",
    });

    const buildPayload = (set: LocalSet) => ({
      reps: set.reps,
      weight: set.weight,
      duration: set.duration,
      distance: set.distance,
      notes: set.notes,
    });

    const addSet = () => {
      onManualEdit?.();
      const newId = `new-${Date.now()}`;
      setSets((prev) => {
        const sortedByNumber = [...prev].sort(
          (a, b) => a.set_number - b.set_number
        );
        const nextSetNumber =
          sortedByNumber.length > 0
            ? sortedByNumber[sortedByNumber.length - 1].set_number + 1
            : 1;

        const previousSet =
          sortedByNumber.length > 0
            ? sortedByNumber[sortedByNumber.length - 1]
            : undefined;

        return [
          ...prev,
          {
            id: newId,
            set_number: nextSetNumber,
            reps: previousSet?.reps ?? null,
            weight: previousSet?.weight ?? null,
            duration: null,
            distance: null,
            notes: null,
            _status: "new",
          },
        ];
      });
    };

    const deleteSet = (idx: number) => {
      onManualEdit?.();
      const target = sets[idx];
      if (!target) return;

      // If the set is not yet persisted, just drop it locally
      if (typeof target.id === "string") {
        setSets((prev) => prev.filter((_, i) => i !== idx));
        return;
      }

      setDeletedSetIds((prev) =>
        prev.includes(Number(target.id)) ? prev : [...prev, Number(target.id)]
      );
      setSets((prev) => prev.filter((_, i) => i !== idx));
    };

    const replaceWithSets = (nextSets: ExerciseSetDraftValue[]) => {
      setReferenceSets(nextSets);
      const persistedSetIds = sets
        .filter((set) => typeof set.id === "number")
        .map((set) => Number(set.id));

      if (persistedSetIds.length > 0) {
        setDeletedSetIds((prev) =>
          Array.from(new Set([...prev, ...persistedSetIds]))
        );
      }

      const timestamp = Date.now();
      setSets(
        nextSets.map((set, index) => ({
          id: `suggested-${timestamp}-${index}`,
          set_number: index + 1,
          reps: set.reps ?? null,
          weight: set.weight ?? null,
          duration:
            typeof set.duration === "string"
              ? set.duration
              : set.duration != null
              ? String(set.duration)
              : null,
          distance: set.distance ?? null,
          notes: set.notes ?? null,
          _status: "new",
        }))
      );
    };

    const save = async (opts?: { silent?: boolean }) => {
      try {
        const deletedSetIdsToPersist = [...deletedSetIds];
        const indicesToPersist = sets.reduce<Array<number>>((acc, set, idx) => {
          if (typeof set.id === "string" || set._status === "dirty") {
            if (typeof set.id === "string" && !hasMeaningfulValue(set)) {
              return acc;
            }
            acc.push(idx);
          }
          return acc;
        }, []);

        const deleteResults = await Promise.allSettled(
          deletedSetIdsToPersist.map(async (setId) => {
            await deleteExerciseSetAction({
              workoutId,
              workoutExerciseId,
              setId,
            });
            return setId;
          })
        );

        const deletedSucceeded = new Set<number>(
          deleteResults.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : []
          )
        );
        const deleteFailed = deleteResults.some(
          (result) => result.status === "rejected"
        );

        const saveResults = await Promise.allSettled(
          indicesToPersist.map(async (idx) => {
            const target = sets[idx];
            const data = await saveExerciseSetAction({
              workoutId,
              workoutExerciseId,
              setId: typeof target.id === "number" ? target.id : undefined,
              payload: buildPayload(target),
            });
            return { idx, data };
          })
        );

        const saveSucceeded = saveResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        );
        const saveFailed = saveResults.some(
          (result) => result.status === "rejected"
        );

        setSets((prev) => {
          const out = [...prev];
          for (const { idx, data } of saveSucceeded) {
            const normalized = normalizeApiSet(data);
            const originalId = prev[idx]?.id;
            const matchIndex = out.findIndex((s) => s.id === originalId);

            if (matchIndex >= 0) {
              out[matchIndex] = normalized;
            } else {
              out[idx] = normalized;
            }
          }
          out.sort((a, b) => a.set_number - b.set_number);
          return out;
        });
        setDeletedSetIds((prev) => prev.filter((id) => !deletedSucceeded.has(id)));

        if (deleteFailed || saveFailed) {
          throw new Error("Failed to save some set changes");
        }

        // Ensure parent clears dirty state immediately after a successful save
        if (lastDirtyRef.current) {
          lastDirtyRef.current = false;
          if (typeof onDirtyChange === "function") onDirtyChange(false);
        }

        if (!opts?.silent) toast.success("Sets saved");
        if (!opts?.silent) onSaved?.();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to save sets");
      }
    };

    useImperativeHandle(ref, () => ({ save, replaceWithSets }));

    return (
      <div className="mb-4 space-y-3">
        {sets.map((set, idx) => {
          const ref = referenceSets[idx];
          return (
            <div key={set.id} className="flex items-start gap-3">
              <span className="w-14 shrink-0 pt-1.5 text-sm text-gray-600 dark:text-gray-400">
                Set {set.set_number}
              </span>

              {(!exerciseType || exerciseType.has_weight !== false) && (
                <div className="flex flex-col gap-0.5">
                  <label className="flex items-center gap-1.5">
                    <span className="w-7 text-xs text-gray-500 dark:text-gray-400">lbs</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={set.weight ?? ""}
                      onChange={(e) => onChangeField(idx, "weight", e.target.value)}
                      disabled={set._status === "saving"}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
                    />
                  </label>
                  {ref?.weight != null && (
                    <span className="pl-[2.125rem] text-[11px] text-gray-400 dark:text-gray-500">
                      prev {ref.weight}
                    </span>
                  )}
                </div>
              )}

              {(!exerciseType || exerciseType.has_reps !== false) && (
                <div className="flex flex-col gap-0.5">
                  <label className="flex items-center gap-1.5">
                    <span className="w-7 text-xs text-gray-500 dark:text-gray-400">reps</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps ?? ""}
                      onChange={(e) => onChangeField(idx, "reps", e.target.value)}
                      disabled={set._status === "saving"}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
                    />
                  </label>
                  {ref?.reps != null && (
                    <span className="pl-[2.125rem] text-[11px] text-gray-400 dark:text-gray-500">
                      prev {ref.reps}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => deleteSet(idx)}
                className="mt-0.5 ml-auto inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-900/40"
                disabled={set._status === "saving"}
                aria-label="Delete set"
                title="Delete set"
              >
                {set._status === "saving" ? "Saving..." : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={addSet}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            Add set
          </button>
        </div>
      </div>
    );
  }
);
ExerciseSetForm.displayName = "ExerciseSetForm";

export default ExerciseSetForm;
