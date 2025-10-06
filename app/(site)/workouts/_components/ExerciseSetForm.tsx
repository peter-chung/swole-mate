"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { Tables } from "@/types/database.types";
import { toast } from "react-hot-toast";

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
  _status?: "clean" | "dirty" | "new" | "deleting" | "saving";
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
    const [saving, setSaving] = useState(false);
    const lastDirtyRef = useRef<boolean>(false);

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

      const sameLength = sets.length === normalized.length;
      const isSame =
        sameLength &&
        sets.every((cur, i) => {
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

      if (!isSame) {
        setSets(normalized);
        // Reset dirty state when server-provided sets change
        if (lastDirtyRef.current) {
          lastDirtyRef.current = false;
          if (typeof onDirtyChange === "function") onDirtyChange(false);
        }
      }
    }, [exerciseSets]);

    // Report dirty-state to parent when it changes
    useEffect(() => {
      const hasDirty = sets.some(
        (s) => s._status === "dirty" || s._status === "new"
      );
      if (lastDirtyRef.current !== hasDirty) {
        lastDirtyRef.current = hasDirty;
        if (typeof onDirtyChange === "function") onDirtyChange(hasDirty);
      }
    }, [sets]);

    const nextSetNumber = useMemo(
      () =>
        sets.length > 0 ? Math.max(...sets.map((s) => s.set_number)) + 1 : 1,
      [sets]
    );

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

    const syncSet = async (set: LocalSet): Promise<ApiExerciseSet> => {
      const payload = buildPayload(set);

      if (typeof set.id === "string") {
        const res = await fetch(
          `/api/workouts/${encodeURIComponent(
            workoutId
          )}/workout-exercises/${workoutExerciseId}/exercise-sets/new`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data?.error || "Failed to create exercise set");
        return data as ApiExerciseSet;
      }

      const res = await fetch(
        `/api/workouts/${encodeURIComponent(
          workoutId
        )}/workout-exercises/${workoutExerciseId}/exercise-sets/${set.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to update exercise set");
      return data as ApiExerciseSet;
    };

    const persistSet = async (idx: number, opts?: { silent?: boolean }) => {
      const target = sets[idx];
      if (!target) return;
      if (target._status === "saving" || target._status === "deleting") return;
      if (target._status !== "dirty" && target._status !== "new") return;

      if (typeof target.id === "string" && !hasMeaningfulValue(target)) {
        return;
      }

      setSets((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, _status: "saving" } : s))
      );

      try {
        const apiSet = await syncSet(target);
        const normalized = normalizeApiSet(apiSet);

        setSets((prev) => {
          const out = [...prev];
          const originalId = target.id;
          const matchIndex = out.findIndex((s) => s.id === originalId);

          if (matchIndex >= 0) {
            out[matchIndex] = normalized;
          } else {
            out[idx] = normalized;
          }

          out.sort((a, b) => a.set_number - b.set_number);
          return out;
        });

        if (!opts?.silent) {
          toast.success("Set saved");
          onSaved?.();
        }
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Failed to save exercise set";
        toast.error(message);

        setSets((prev) =>
          prev.map((s, i) =>
            i === idx
              ? {
                  ...s,
                  _status: typeof target.id === "string" ? "new" : "dirty",
                }
              : s
          )
        );
      }
    };

    const addSet = () => {
      setSets((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          set_number: nextSetNumber,
          reps: null,
          weight: null,
          duration: null,
          distance: null,
          notes: null,
          _status: "new",
        },
      ]);
    };

    const deleteSet = async (idx: number) => {
      const target = sets[idx];
      if (!target) return;

      // If the set is not yet persisted, just drop it locally
      if (typeof target.id === "string") {
        setSets((prev) => prev.filter((_, i) => i !== idx));
        onSaved?.();
        return;
      }

      try {
        setSets((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, _status: "deleting" } : s))
        );
        const res = await fetch(
          `/api/workouts/${encodeURIComponent(
            workoutId
          )}/workout-exercises/${workoutExerciseId}/exercise-sets/${target.id}`,
          { method: "DELETE" }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || "Failed to delete set");
        setSets((prev) => prev.filter((_, i) => i !== idx));
        onSaved?.();
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete set"
        );
        setSets((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, _status: "clean" } : s))
        );
      }
    };

    const save = async (opts?: { silent?: boolean }) => {
      try {
        setSaving(true);

        const indicesToPersist = sets.reduce<Array<number>>((acc, set, idx) => {
          if (typeof set.id === "string" || set._status === "dirty") {
            if (typeof set.id === "string" && !hasMeaningfulValue(set)) {
              return acc;
            }
            acc.push(idx);
          }
          return acc;
        }, []);

        const results = await Promise.all(
          indicesToPersist.map(async (idx) => {
            const data = await syncSet(sets[idx]);
            return { idx, data };
          })
        );

        setSets((prev) => {
          const out = [...prev];
          for (const { idx, data } of results) {
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
      } finally {
        setSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({ save }));

    return (
      <div className="mb-4 space-y-3">
        {sets.map((set, idx) => (
          <div
            key={set.id}
            className="flex items-end gap-3"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                void persistSet(idx, { silent: true });
              }
            }}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 w-14">
              Set {set.set_number}
            </div>
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
            <button
              type="button"
              onClick={() => deleteSet(idx)}
              className="ml-auto inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-900/40"
              disabled={set._status === "deleting" || set._status === "saving"}
              aria-label="Delete set"
              title="Delete set"
            >
              {set._status === "deleting"
                ? "Deleting…"
                : set._status === "saving"
                ? "Saving…"
                : "✕"}
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
