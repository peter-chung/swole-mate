"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EditExerciseForm from "../../_components/EditExerciseForm";
import type { Tables } from "@/types/database.types";

const isCustomSource = (source?: string | null) => source === "custom";

type ApiExercise = Tables<"available_exercises"> & {
  primary_muscle?: string | null;
  other_muscles?: string | null;
};

type EditableExercise = Tables<"custom_exercises"> & {
  exercise_type_label?: string | null;
  exercise_type_key?: string | null;
};

const EditExercisePage = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const [exercise, setExercise] = useState<EditableExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercise = useCallback(async () => {
    if (!exerciseId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/exercises/${exerciseId}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      const data: ApiExercise | null = result.data ?? null;

      if (!data || !isCustomSource(data.source)) {
        setExercise(null);
        setError("Only custom exercises can be edited.");
        return;
      }

      if (data.id == null || !data.exercise_type_id || !data.user_id) {
        setError("Exercise data is incomplete.");
        setExercise(null);
        return;
      }

      const mapped: EditableExercise = {
        id: data.id,
        name: data.name ?? "",
        primary_muscle: data.primary_muscle ?? null,
        other_muscles: data.other_muscles ?? null,
        exercise_type_id: data.exercise_type_id,
        user_id: data.user_id,
        created_at: data.created_at ?? new Date().toISOString(),
        exercise_type_label: data.exercise_type_label ?? null,
        exercise_type_key: data.exercise_type_key ?? null,
      } as EditableExercise;

      setExercise(mapped);
    } catch (err) {
      console.error("Error loading exercise for edit:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load exercise details."
      );
      setExercise(null);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchExercise();
  }, [fetchExercise]);

  useEffect(() => {
    if (error && !loading && !exercise) {
      const timeout = setTimeout(() => {
        router.replace(`/exercises/${exerciseId}`);
      }, 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [error, exercise, exerciseId, loading, router]);

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Edit Exercise
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Update the details of your custom exercise.
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200">
              {error}
            </div>
          ) : exercise ? (
            <EditExerciseForm exercise={exercise} resourceId={exerciseId} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EditExercisePage;
