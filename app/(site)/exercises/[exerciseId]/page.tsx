"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Tables } from "@/types/database.types";
import EditExerciseForm from "../_components/EditExerciseForm";

type Exercise = Tables<"exercises">;

const Page = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercise = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/exercises/${exerciseId}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      setExercise(result.data);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      setError("We couldn't load this exercise. Please try again.");
      setExercise(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExercise();
  }, [exerciseId]);

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Edit Exercise
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Edit the details of the exercise.
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
          ) : (
            <EditExerciseForm exercise={exercise} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
