"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { Tables, TablesUpdate } from "@/types/database.types";
import { InputField, SelectField } from "@/app/_components/FormFields";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import Button from "@/app/_components/Button";
import { useExerciseTypes } from "../_hooks/useExerciseTypes";

type Exercise = Tables<"custom_exercises"> & {
  exercise_type_label?: string | null;
  exercise_type_key?: string | null;
};

type Props = {
  exercise: Exercise | null;
  resourceId?: string;
  isPublic?: boolean;
};

const EditExerciseForm = ({ exercise, resourceId, isPublic = false }: Props) => {
  const [updatedExercise, setUpdatedExercise] =
    useState<TablesUpdate<"custom_exercises">>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { exerciseTypes, isFetchingTypes } = useExerciseTypes();
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

  const baseEndpoint = isPublic
    ? `/api/public-exercises/${resourceId ?? exercise?.id}`
    : `/api/exercises/${resourceId ?? exercise?.id}`;

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
      const res = await fetch(baseEndpoint, {
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
      const res = await fetch(baseEndpoint, { method: "DELETE" });
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
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to exercises</span>
        </Link>
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <InputField
          id="exerciseName"
          label="Exercise Name"
          type="text"
          defaultValue={exercise?.name ?? ""}
          placeholder="e.g., Bench Press (Barbell)"
          autoComplete="off"
          onChange={(e) =>
            setUpdatedExercise((prev) => ({ ...prev, name: e.target.value }))
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
            setUpdatedExercise((prev) => ({ ...prev, primary_muscle: e.target.value }))
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
            setUpdatedExercise((prev) => ({ ...prev, other_muscles: e.target.value }))
          }
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Optional. Separate multiple muscles with commas.
        </p>
        <SelectField
          id="exerciseType"
          label="Exercise Type"
          value={selectedExerciseTypeId}
          onChange={(e) =>
            setUpdatedExercise((prev) => ({
              ...prev,
              exercise_type_id: e.target.value || undefined,
            }))
          }
          disabled={isFetchingTypes || exerciseTypes.length === 0}
        >
          <option value="">
            {isFetchingTypes ? "Loading types..." : "Select an exercise type"}
          </option>
          {shouldRenderFallbackOption && fallbackExerciseTypeLabel && (
            <option value={selectedExerciseTypeId}>
              {fallbackExerciseTypeLabel}
            </option>
          )}
          {exerciseTypes.map((exerciseType) => (
            <option key={exerciseType.id} value={exerciseType.id}>
              {exerciseType.label}
            </option>
          ))}
        </SelectField>

        <div className="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="Delete exercise?"
          description="This action is permanent and cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive
          confirmLoading={isDeleting}
          onCancel={() => { if (!isDeleting) setConfirmOpen(false); }}
          onConfirm={confirmDelete}
        />
      </form>
    </div>
  );
};

export default EditExerciseForm;
