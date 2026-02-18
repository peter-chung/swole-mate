"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { Tables } from "@/types/database.types";
import { toast } from "react-hot-toast";
import {
  deleteExerciseSetAction,
  saveExerciseSetAction,
} from "../actions";

type ExerciseSet = Tables<"exercise_sets">;

export type ExerciseSetFormHandle = {
  // Imperatively save this form's sets
  save: (opts?: { silent?: boolean }) => Promise<void>;
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
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
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
    { workoutId, workoutExerciseId, exerciseSets, onSaved, onDirtyChange },
    ref
  ) => {
    const [sets, setSets] = useState<LocalSet[]>([]);
    const [deletedSetIds, setDeletedSetIds] = useState<number[]>([]);
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
      field: keyof Pick<LocalSet, "reps" | "weight" | "notes">,
      value: string
    ) => {
      setSets((prev) => {
        const copy = [...prev];
        const current = copy[idx];
        if (!current) return prev;
        const markDirty =
          current._status === "clean" ? "dirty" : current._status ?? "dirty";

        if (field === "notes") {
          const nv: string | null = value === "" ? null : value;
          copy[idx] = { ...current, notes: nv, _status: markDirty };
        } else if (field === "reps") {
          const n = value === "" ? null : Number(value);
          const nv: number | null = n === null || Number.isNaN(n) ? null : n;
          copy[idx] = { ...current, reps: nv, _status: markDirty };
        } else if (field === "weight") {
          const n = value === "" ? null : Number(value);
          const nv: number | null = n === null || Number.isNaN(n) ? null : n;
          copy[idx] = { ...current, weight: nv, _status: markDirty };
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

    useImperativeHandle(ref, () => ({ save }));

    return (
      <div className="mb-4 space-y-3">
        {sets.map((set, idx) => (
          <div
            key={set.id}
            className="flex items-end gap-3"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 w-14">
              Set {set.set_number}
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm">Weight</span>
              <input
                type="number"
                inputMode="decimal"
                value={set.weight ?? ""}
                onChange={(e) => onChangeField(idx, "weight", e.target.value)}
                disabled={set._status === "saving"}
                className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">Reps</span>
              <input
                type="number"
                inputMode="numeric"
                value={set.reps ?? ""}
                onChange={(e) => onChangeField(idx, "reps", e.target.value)}
                disabled={set._status === "saving"}
                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
              />
            </label>
            <button
              type="button"
              onClick={() => deleteSet(idx)}
              className="ml-auto inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-900/40"
              disabled={set._status === "saving"}
              aria-label="Delete set"
              title="Delete set"
            >
              {set._status === "saving" ? "Saving..." : "X"}
            </button>
          </div>
        ))}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={addSet}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
          >
            + Add Set
          </button>
        </div>
      </div>
    );
  }
);
ExerciseSetForm.displayName = "ExerciseSetForm";

export default ExerciseSetForm;
