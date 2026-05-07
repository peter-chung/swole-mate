"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { InputField, SelectField } from "@/app/_components/FormFields";
import type { TablesInsert } from "@/types/database.types";
import Button from "@/app/_components/Button";
import { useExerciseTypes } from "../_hooks/useExerciseTypes";
import { MUSCLE_GROUPS } from "@/app/constants/muscles";

type ExerciseInsert = Omit<TablesInsert<"custom_exercises">, "other_muscles"> & {
  other_muscles?: string[] | null;
};

type ErrorKey = "name" | "type" | "general";
type FormErrors = Partial<Record<ErrorKey, string>>;

type Props = { isPublic?: boolean };

const CreateExerciseForm = ({ isPublic = false }: Props) => {
  const [exercise, setExercise] = useState<Partial<ExerciseInsert>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { exerciseTypes, isFetchingTypes } = useExerciseTypes();
  const router = useRouter();

  const selectedExerciseTypeId = exercise.exercise_type_id ?? "";
  const selectedType = exerciseTypes.find((t) => t.id === selectedExerciseTypeId);
  const isBodyweightSelected = selectedType?.is_bodyweight === true;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors: FormErrors = {};

    if (!exercise.name?.trim()) {
      validationErrors.name = "Please provide an exercise name.";
    }
    if (!exercise.exercise_type_id) {
      validationErrors.type = "Please select an exercise type.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => {
        const next: FormErrors = { ...prev };
        delete next.name;
        delete next.type;
        return { ...next, ...validationErrors };
      });
      return;
    }

    setErrors((prev) => {
      const next: FormErrors = { ...prev };
      delete next.name;
      delete next.type;
      return next;
    });

    try {
      setIsLoading(true);
      const endpoint = isPublic ? "/api/public-exercises" : "/api/exercises";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exercise),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          general: result?.error || "Failed to create exercise. Please try again.",
        }));
        return;
      }

      toast.success(
        isPublic ? "Public exercise created!" : "Exercise created successfully!"
      );
      setErrors({});
      router.push("/exercises");
    } catch (err) {
      console.error("Error creating exercise:", err);
      setErrors((prev) => ({
        ...prev,
        general: "Failed to create exercise. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const nameHasError = Boolean(errors.name);
  const typeHasError = Boolean(errors.type);

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <InputField
          id="exerciseName"
          label="Exercise Name"
          type="text"
          placeholder="e.g., Bench Press (Barbell)"
          autoComplete="off"
          className={
            nameHasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
              : undefined
          }
          aria-invalid={nameHasError || undefined}
          aria-describedby={nameHasError ? "exercise-name-error" : undefined}
          onChange={(e) => {
            const value = e.target.value;
            setExercise((prev) => ({ ...prev, name: value }));
            if (value.trim()) {
              setErrors((prev) => {
                if (!prev.name) return prev;
                const { name, ...rest } = prev;
                return rest;
              });
            }
          }}
        />
        {nameHasError && (
          <p id="exercise-name-error" className="text-xs text-red-600 dark:text-red-300">
            {errors.name}
          </p>
        )}

        <SelectField
          id="primaryMuscle"
          label="Primary Muscle Group"
          value={exercise.primary_muscle ?? ""}
          onChange={(e) =>
            setExercise((prev) => ({ ...prev, primary_muscle: e.target.value || null }))
          }
        >
          <option value="">Select primary muscle</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </SelectField>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Other Muscles
          </p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((muscle) => {
              const selected = (exercise.other_muscles as string[] | null | undefined ?? []).includes(muscle);
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() =>
                    setExercise((prev) => {
                      const current = (prev.other_muscles as string[] | null | undefined) ?? [];
                      return {
                        ...prev,
                        other_muscles: selected
                          ? current.filter((m) => m !== muscle)
                          : [...current, muscle],
                      };
                    })
                  }
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                    selected
                      ? "bg-[#3ecf8e]/10 text-[#3ecf8e] ring-[#3ecf8e]/40 dark:bg-[#3ecf8e]/10 dark:text-[#3ecf8e] dark:ring-[#3ecf8e]/30"
                      : "bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:ring-neutral-700 dark:hover:bg-neutral-700"
                  }`}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>

        <SelectField
          id="exerciseType"
          label="Exercise Type"
          value={selectedExerciseTypeId}
          className={
            typeHasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
              : undefined
          }
          aria-invalid={typeHasError || undefined}
          aria-describedby={typeHasError ? "exercise-type-error" : undefined}
          onChange={(e) => {
            const selectedId = e.target.value;
            setExercise((prev) => ({ ...prev, exercise_type_id: selectedId || undefined }));
            if (selectedId) {
              setErrors((prev) => {
                if (!prev.type) return prev;
                const { type, ...rest } = prev;
                return rest;
              });
            }
          }}
          disabled={isFetchingTypes || exerciseTypes.length === 0}
        >
          <option value="" disabled>
            {isFetchingTypes ? "Loading types..." : "Select an exercise type"}
          </option>
          {exerciseTypes.map((exerciseType) => (
            <option key={exerciseType.id} value={exerciseType.id}>
              {exerciseType.label}
            </option>
          ))}
        </SelectField>
        {typeHasError && (
          <p id="exercise-type-error" className="text-xs text-red-600 dark:text-red-300">
            {errors.type}
          </p>
        )}

        {errors.general && (
          <div
            className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200"
            role="alert"
          >
            {errors.general}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {isPublic ? "Create Public Exercise" : "Create Exercise"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateExerciseForm;
