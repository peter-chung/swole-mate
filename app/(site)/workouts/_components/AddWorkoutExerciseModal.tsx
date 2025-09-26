"use client";

import React, { useEffect, useState } from "react";
import { useDebounce } from "react-use";

type Exercise = {
  id: string;
  name: string;
  type: string | null;
};

type Props = {
  open: boolean;
  workoutId: string;
  onClose: () => void;
  onAdded?: () => void;
};

const AddWorkoutExerciseModal = ({
  open,
  workoutId,
  onClose,
  onAdded,
}: Props) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useDebounce(() => setDebouncedQuery(query), 500, [query]);

  useEffect(() => {
    if (!open) return;

    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = debouncedQuery
          ? `/api/exercises?search=${encodeURIComponent(debouncedQuery)}`
          : "/api/exercises";
        const res = await fetch(url);
        const result = await res.json();
        if (!res.ok)
          throw new Error(result?.error || "Failed to load exercises");
        const mapped: Exercise[] = (result.data ?? []).map((exercise: any) => ({
          id: exercise.id ?? "",
          name: exercise.name ?? "",
          type: exercise.exercise_type_label ?? null,
        }));
        setExercises(mapped);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [open, debouncedQuery]);

  const handleSelect = async (exercise: Exercise) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/workouts/${workoutId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_id: exercise.id }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(result?.error || `Failed with ${res.status}`);
      onAdded?.();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Something went wrong";
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 cursor-pointer"
        aria-hidden
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Add Exercise
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for exercises"
            className="w-full rounded-lg border border-gray-300 bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-700"
          />
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-gray-500">No exercises found.</p>
          ) : (
            <ul className="max-h-80 overflow-auto divide-y divide-gray-200 dark:divide-neutral-800">
              {exercises.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(ex)}
                    className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left hover:bg-gray-50 active:translate-y-px dark:hover:bg-neutral-800/60"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ex.name}
                    </span>
                    {ex.type && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                        {ex.type}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddWorkoutExerciseModal;
