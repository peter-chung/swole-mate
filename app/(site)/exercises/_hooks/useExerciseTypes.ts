"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/types/database.types";
import { toast } from "react-hot-toast";

type ExerciseType = Tables<"exercise_types">;

const UNSUPPORTED_KEYS = new Set([
  "duration",
  "distance_duration",
  "weight_duration",
  "weight_distance",
  "duration_weight",
  "weighted_bodyweight",   // superseded by bodyweight_reps with signed weight support
  "assisted_bodyweight",   // superseded by bodyweight_reps with signed weight support
]);

export function useExerciseTypes() {
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [isFetchingTypes, setIsFetchingTypes] = useState(false);

  useEffect(() => {
    const fetchExerciseTypes = async () => {
      try {
        setIsFetchingTypes(true);
        const res = await fetch("/api/exercise-types");
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setExerciseTypes(
          (result.data ?? []).filter(
            (t: ExerciseType) => !UNSUPPORTED_KEYS.has(t.key)
          )
        );
      } catch (err) {
        console.error("Error fetching exercise types:", err);
        toast.error("Failed to load exercise types. Please refresh the page.");
      } finally {
        setIsFetchingTypes(false);
      }
    };

    fetchExerciseTypes();
  }, []);

  return { exerciseTypes, isFetchingTypes };
}
