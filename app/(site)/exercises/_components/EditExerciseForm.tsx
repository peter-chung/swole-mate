"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Tables, TablesUpdate } from "@/types/database.types";
import { InputField, SelectField } from "@/app/_components/FormFields";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/app/_components/ConfirmDialog";

type Exercise = Tables<"custom_exercises"> & {
  exercise_type_label?: string | null;
  exercise_type_key?: string | null;
};
type ExerciseType = Tables<"exercise_types">;

type Props = {
  exercise: Exercise | null;
  resourceId?: string;
};

const EditExerciseForm = ({ exercise, resourceId }: Props) => {
  const [updatedExercise, setUpdatedExercise] =
    useState<TablesUpdate<"custom_exercises">>({});
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [isFetchingTypes, setIsFetchingTypes] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  const router = useRouter();

  const selectedExerciseTypeId =
    updatedExercise.exercise_type_id ?? exercise?.exercise_type_id ?? "";
  const shouldRenderFallbackOption =
    Boolean(selectedExerciseTypeId) &&
    !exerciseTypes.some((type) => type.id === selectedExerciseTypeId);
  const fallbackExerciseTypeLabel = useMemo(
    () => exercise?.exercise_type_label ?? null,
    [exercise?.exercise_type_label]
  );

  useEffect(() => {
    const fetchExerciseTypes = async () => {
      try {
        setIsFetchingTypes(true);
        const res = await fetch("/api/exercise-types");
        const result = await res.json();

        if (!res.ok) throw new Error(result.error);

        const UNSUPPORTED_KEYS = new Set([
          "duration",
          "distance_duration",
          "weight_duration",
          "weight_distance",
          "duration_weight",
        ]);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetId = resourceId ?? exercise?.id;
    if (!exercise || !targetId) return;

    if (Object.keys(updatedExercise).length === 0) {
      router.push("/exercises");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`/api/exercises/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExercise),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Exercise updated successfully!");
      router.push("/exercises");
    } catch (err) {
      toast.error("Failed to update exercise. Please try again.");
      console.error("Error updating exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    const targetId = resourceId ?? exercise?.id;
    if (!exercise || !targetId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/exercises/${targetId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed with ${res.status}`);
      }
      setConfirmOpen(false);
      toast.success("Exercise deleted successfully.");
      router.push("/exercises");
    } catch (err) {
      toast.error("Failed to delete exercise. Please try again.");
      console.error("Error deleting exercise:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
    >
      <InputField
        id="exerciseName"
        label="Exercise Name"
        type="text"
        defaultValue={exercise?.name ?? ""}
        placeholder="e.g., Bench Press (Barbell)"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            name: (e.target as HTMLInputElement).value,
          }))
        }
      />
      <InputField
        id="primaryMuscle"
        label="Primary Muscle Group"
        type="text"
        defaultValue={exercise?.primary_muscle ?? ""}
        placeholder="e.g., Chest"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            primary_muscle: (e.target as HTMLInputElement).value,
          }))
        }
      />
      <InputField
        id="otherMuscles"
        label="Other Muscles"
        type="text"
        defaultValue={exercise?.other_muscles ?? ""}
        placeholder="e.g., Triceps, Shoulders"
        autoComplete="off"
        onChange={(e) =>
          setUpdatedExercise((prev) => ({
            ...prev,
            other_muscles: (e.target as HTMLInputElement).value,
          }))
        }
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Optional. Separate multiple muscles with commas.
      </p>
      <SelectField
        id="exerciseType"
        label="Exercise Type"
        value={selectedExerciseTypeId}
        onChange={(e) => {
          const selectedId = e.target.value;
          setUpdatedExercise((prev) => ({
            ...prev,
            exercise_type_id: selectedId || undefined,
          }));
        }}
        disabled={isFetchingTypes || exerciseTypes.length === 0}
      >
        <option value="">
          {isFetchingTypes ? "Loading types..." : "Select an exercise type"}
        </option>
        {shouldRenderFallbackOption && fallbackExerciseTypeLabel ? (
          <option
            value={selectedExerciseTypeId}
            style={{
              backgroundColor: "#2563eb",
              color: "#f8fafc",
            }}
          >
            {fallbackExerciseTypeLabel}
          </option>
        ) : null}
        {exerciseTypes.map((exerciseType) => (
          <option
            key={exerciseType.id}
            value={exerciseType.id}
            style={
              exerciseType.id === selectedExerciseTypeId
                ? {
                    backgroundColor: "#2563eb",
                    color: "#f8fafc",
                  }
                : undefined
            }
          >
            {exerciseType.label}
          </option>
        ))}
      </SelectField>

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to exercises</span>
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-700 bg-transparent px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete exercise?"
        description="This action is permanent and cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        confirmLoading={isDeleting}
        onCancel={() => {
          if (!isDeleting) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
      />
    </form>
  );
};

export default EditExerciseForm;
