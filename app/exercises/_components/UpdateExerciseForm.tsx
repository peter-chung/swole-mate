"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { Tables } from "@/types/database.types";

type Exercise = Tables<"exercises">;

type Props = {
  exercise: Exercise | null;
};

const UpdateExerciseForm = ({ exercise }: Props) => {
  const [updatedExercise, setUpdatedExercise] = useState<Partial<Exercise>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!exercise) return;

    try {
      setIsLoading(true);

      const res = await fetch(`/api/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExercise), // send only changed fields
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      console.log("Updated exercise:", result.data);

      // navigate back to exercises list
      router.push("/exercises");
    } catch (err) {
      console.error("Error updating exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="exerciseName">Exercise Name</label>
        <input
          id="exerciseName"
          type="text"
          defaultValue={exercise?.name ?? ""}
          onChange={(e) =>
            setUpdatedExercise((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>
      <div>
        <label htmlFor="primaryMuscle">Primary Muscle Group</label>
        <input
          id="primaryMuscle"
          type="text"
          defaultValue={exercise?.primary_muscle ?? ""}
          onChange={(e) =>
            setUpdatedExercise((prev) => ({
              ...prev,
              primary_muscle: e.target.value,
            }))
          }
        />
      </div>
      <div>
        <label htmlFor="otherMuscles">Other Muscles</label>
        <input
          id="otherMuscles"
          type="text"
          defaultValue={exercise?.other_muscles ?? ""}
          onChange={(e) =>
            setUpdatedExercise((prev) => ({
              ...prev,
              other_muscles: e.target.value,
            }))
          }
        />
      </div>
      <div>
        <label htmlFor="exerciseType">Exercise Type</label>
        <input
          id="exerciseType"
          type="text"
          defaultValue={exercise?.type ?? ""}
          onChange={(e) =>
            setUpdatedExercise((prev) => ({ ...prev, type: e.target.value }))
          }
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Editing..." : "Edit Exercise"}
      </button>
    </form>
  );
};

export default UpdateExerciseForm;
