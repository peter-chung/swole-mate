"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Plus, X } from "lucide-react";
import type { Tables } from "@/types/database.types";
import { toast } from "react-hot-toast";
import { saveRoutineSetAction, deleteRoutineSetAction } from "../actions";

type RoutineSet = Tables<"routine_sets">;

export type RoutineSetFormHandle = {
  save: (opts?: { silent?: boolean }) => Promise<void>;
};

type ExerciseTypeFlags = {
  has_weight: boolean | null;
  has_reps: boolean | null;
  has_duration: boolean | null;
  has_distance: boolean | null;
  is_bodyweight: boolean | null;
};

type Props = {
  routineId: string;
  routineExerciseId: number;
  routineSets: Array<
    Pick<
      RoutineSet,
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
};

type LocalSet = {
  id: number | string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: string | null;
  distance: number | null;
  notes: string | null;
  _status?: "clean" | "dirty" | "new" | "deleted" | "saving";
};

type ApiRoutineSet = {
  id: number;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: unknown | null;
  distance: number | null;
  notes: string | null;
};

const RoutineSetForm = forwardRef<RoutineSetFormHandle, Props>(
  (
    {
      routineId,
      routineExerciseId,
      routineSets,
      exerciseType,
      onSaved,
      onDirtyChange,
    },
    ref,
  ) => {
    const [sets, setSets] = useState<LocalSet[]>([]);
    const [referenceSets, setReferenceSets] = useState<Array<{ weight: number | null; reps: number | null }>>([]);
    const lastDirtyRef = useRef<boolean>(false);
    const dirtyCallbackRef = useRef<Props["onDirtyChange"]>(undefined);

    useEffect(() => {
      dirtyCallbackRef.current = onDirtyChange;
    }, [onDirtyChange]);

    useEffect(() => {
      const normalized: LocalSet[] = (routineSets ?? [])
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
      setReferenceSets(normalized.map((s) => ({ weight: s.weight, reps: s.reps })));
    }, [routineSets]);

    useEffect(() => {
      const hasDirty = sets.some(
        (s) =>
          s._status === "dirty" ||
          s._status === "new" ||
          s._status === "deleted",
      );
      if (lastDirtyRef.current !== hasDirty) {
        lastDirtyRef.current = hasDirty;
        const callback = dirtyCallbackRef.current;
        if (typeof callback === "function") callback(hasDirty);
      }
    }, [sets]);

    const onChangeField = (
      idx: number,
      field: keyof Pick<
        LocalSet,
        "reps" | "weight" | "duration" | "distance" | "notes"
      >,
      value: string,
    ) => {
      setSets((prev) => {
        const copy = [...prev];
        const current = copy[idx];
        if (!current) return prev;
        const markDirty =
          current._status === "clean" ? "dirty" : (current._status ?? "dirty");

        if (field === "notes") {
          copy[idx] = {
            ...current,
            notes: value === "" ? null : value,
            _status: markDirty,
          };
        } else if (field === "reps") {
          const n = value === "" ? null : Number(value);
          copy[idx] = {
            ...current,
            reps: n === null || Number.isNaN(n) ? null : n,
            _status: markDirty,
          };
        } else if (field === "weight") {
          const n = value === "" ? null : Number(value);
          copy[idx] = {
            ...current,
            weight: n === null || Number.isNaN(n) ? null : n,
            _status: markDirty,
          };
        } else if (field === "duration") {
          copy[idx] = {
            ...current,
            duration: value === "" ? null : value,
            _status: markDirty,
          };
        } else if (field === "distance") {
          const n = value === "" ? null : Number(value);
          copy[idx] = {
            ...current,
            distance: n === null || Number.isNaN(n) ? null : n,
            _status: markDirty,
          };
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

    const normalizeApiSet = (apiSet: ApiRoutineSet): LocalSet => ({
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
      setSets((prev) => {
        const sortedByNumber = [...prev].sort(
          (a, b) => a.set_number - b.set_number,
        );
        const nextSetNumber =
          sortedByNumber.length > 0
            ? sortedByNumber[sortedByNumber.length - 1].set_number + 1
            : 1;

        const lastNonDeleting = sortedByNumber.filter(
          (set) => set._status !== "deleted",
        );
        const previousSet =
          lastNonDeleting.length > 0
            ? lastNonDeleting[lastNonDeleting.length - 1]
            : undefined;

        return [
          ...prev,
          {
            id: `new-${Date.now()}`,
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

      if (typeof target.id === "string") {
        setSets((prev) => prev.filter((_, i) => i !== idx));
        return;
      }

      setSets((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, _status: "deleted" } : s)),
      );
    };

    const save = async (opts?: { silent?: boolean }) => {
      try {
        const snapshot = sets;

        await Promise.all(
          snapshot
            .filter((s) => s._status === "deleted" && typeof s.id === "number")
            .map((s) =>
              deleteRoutineSetAction({
                routineId,
                routineExerciseId,
                setId: s.id as number,
              }),
            ),
        );

        const indicesToPersist = snapshot.reduce<Array<number>>(
          (acc, set, idx) => {
            if (set._status === "deleted") return acc;
            if (typeof set.id === "string" || set._status === "dirty") {
              if (typeof set.id === "string" && !hasMeaningfulValue(set))
                return acc;
              acc.push(idx);
            }
            return acc;
          },
          [],
        );

        const results = await Promise.all(
          indicesToPersist.map(async (idx) => {
            const target = snapshot[idx];
            const data = await saveRoutineSetAction({
              routineId,
              routineExerciseId,
              setId: typeof target.id === "number" ? target.id : undefined,
              payload: buildPayload(target),
            });
            return { idx, data };
          }),
        );

        setSets((prev) => {
          const out = prev.filter((s) => s._status !== "deleted");
          for (const { idx, data } of results) {
            const normalized = normalizeApiSet(data);
            const originalId = snapshot[idx]?.id;
            const matchIndex = out.findIndex((s) => s.id === originalId);
            if (matchIndex >= 0) {
              out[matchIndex] = normalized;
            }
          }
          out.sort((a, b) => a.set_number - b.set_number);
          return out;
        });

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

    const showWeight = !exerciseType || exerciseType.has_weight !== false;
    const showReps = !exerciseType || exerciseType.has_reps !== false;
    const colTemplate = [
      "2.5rem",
      "4.5rem",
      showWeight ? "minmax(0,1fr)" : null,
      showReps ? "minmax(0,1fr)" : null,
      "2rem",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div>
        {/* Column headers */}
        <div
          className="mb-1.5 grid items-center gap-x-4 px-0.5 text-center text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <span>Set</span>
          <span>Previous</span>
          {showWeight && <span>lbs</span>}
          {showReps && <span>reps</span>}
          <span />
        </div>

        {/* Set rows */}
        <div className="space-y-1.5">
          {sets.map((set, idx) => {
            const ref = referenceSets[idx];
            const prevParts = [
              ref?.weight != null ? `${ref.weight} lbs` : null,
              ref?.reps != null ? `${ref.reps}` : null,
            ].filter(Boolean);
            const prevLabel = prevParts.length > 0 ? prevParts.join(" x ") : "—";
            return set._status === "deleted" ? null : (
              <div
                key={set.id}
                className="grid items-center gap-x-4"
                style={{ gridTemplateColumns: colTemplate }}
              >
                <span className="text-center text-sm text-gray-500 dark:text-gray-400">
                  {set.set_number}
                </span>
                <span className="text-center text-sm text-gray-400 dark:text-gray-500">
                  {prevLabel}
                </span>
                {showWeight && (
                  <input
                    type="number"
                    inputMode="decimal"
                    value={set.weight ?? ""}
                    onChange={(e) =>
                      onChangeField(idx, "weight", e.target.value)
                    }
                    disabled={set._status === "saving"}
                    className="w-full rounded border border-gray-300 px-2 py-2 text-center text-sm dark:border-gray-700 dark:bg-transparent"
                  />
                )}
                {showReps && (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ""}
                    onChange={(e) => onChangeField(idx, "reps", e.target.value)}
                    disabled={set._status === "saving"}
                    className="w-full rounded border border-gray-300 px-2 py-2 text-center text-sm dark:border-gray-700 dark:bg-transparent"
                  />
                )}
                <button
                  type="button"
                  onClick={() => deleteSet(idx)}
                  disabled={set._status === "saving"}
                  className="inline-flex items-center justify-center rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 dark:text-gray-600 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                  aria-label="Delete set"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addSet}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 py-2 text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 cursor-pointer dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-900/30 dark:hover:text-gray-300"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add set
        </button>
      </div>
    );
  },
);

RoutineSetForm.displayName = "RoutineSetForm";

export default RoutineSetForm;
