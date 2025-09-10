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

        type Result =
          | { kind: "created"; tempId: string; data: ApiExerciseSet }
          | { kind: "updated"; id: number; data: ApiExerciseSet };

        const actions: Array<Promise<Result>> = [];
        sets.forEach((s) => {
          // Create new
          if (typeof s.id === "string") {
            actions.push(
              (async (): Promise<Result> => {
                const res = await fetch(
                  `/api/workouts/${encodeURIComponent(
                    workoutId
                  )}/workout-exercises/${workoutExerciseId}/exercise-sets/new`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      reps: s.reps,
                      weight: s.weight,
                      notes: s.notes,
                    }),
                  }
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok)
                  throw new Error(data?.error || "Failed to create set");
                return { kind: "created", tempId: s.id as string, data };
              })()
            );
            return;
          }
          // Update existing only if dirty
          if (s._status === "dirty") {
            actions.push(
              (async (): Promise<Result> => {
                const res = await fetch(
                  `/api/workouts/${encodeURIComponent(
                    workoutId
                  )}/workout-exercises/${workoutExerciseId}/exercise-sets/${
                    s.id
                  }`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      reps: s.reps,
                      weight: s.weight,
                      notes: s.notes,
                    }),
                  }
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok)
                  throw new Error(data?.error || "Failed to update set");
                return { kind: "updated", id: s.id as number, data };
              })()
            );
          }
        });

        const results = await Promise.all(actions);

        // Merge results back into local state
        setSets((prev) => {
          const out = [...prev];
          for (const r of results) {
            if (r.kind === "created") {
              const i = out.findIndex((x) => x.id === r.tempId);
              if (i >= 0) {
                out[i] = {
                  id: r.data.id,
                  set_number: r.data.set_number,
                  reps: r.data.reps ?? null,
                  weight: r.data.weight ?? null,
                  duration:
                    typeof r.data.duration === "string"
                      ? r.data.duration
                      : r.data.duration != null
                      ? String(r.data.duration)
                      : null,
                  distance: r.data.distance ?? null,
                  notes: r.data.notes ?? null,
                  _status: "clean",
                };
              }
            } else if (r.kind === "updated") {
              const i = out.findIndex((x) => x.id === r.id);
              if (i >= 0) {
                out[i] = {
                  ...out[i],
                  reps: r.data.reps ?? out[i].reps ?? null,
                  weight: r.data.weight ?? out[i].weight ?? null,
                  duration:
                    typeof r.data.duration === "string"
                      ? r.data.duration
                      : r.data.duration != null
                      ? String(r.data.duration)
                      : out[i].duration ?? null,
                  distance: r.data.distance ?? out[i].distance ?? null,
                  notes: r.data.notes ?? out[i].notes ?? null,
                  _status: "clean",
                };
              }
            }
          }
          // Ensure natural ordering by set_number
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
        if (!opts?.silent)
          toast.error(
            err instanceof Error ? err.message : "Failed to save sets"
          );
      } finally {
        setSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({ save }));

    return (
      <div className="mb-4 space-y-3">
        {sets.map((set, idx) => (
          <div key={set.id} className="flex items-end gap-3">
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
                className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-transparent"
              />
            </label>
            <button
              type="button"
              onClick={() => deleteSet(idx)}
              className="ml-auto inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-900/40"
              disabled={set._status === "deleting"}
              aria-label="Delete set"
              title="Delete set"
            >
              {set._status === "deleting" ? "Deleting…" : "✕"}
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
