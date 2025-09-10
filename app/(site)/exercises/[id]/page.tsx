"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";
import UpdateExerciseForm from "../_components/UpdateExerciseForm";

type Exercise = Tables<"exercises">;

const Page = () => {
  const { id: exerciseId } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);

  const router = useRouter();

  const fetchExercise = async () => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      setExercise(result.data);
    } catch (error) {
      console.error("Error fetching exercise:", error);
    }
  };

  useEffect(() => {
    fetchExercise();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/exercises"); // redirect back to list
    } catch (error) {
      console.error("Error deleting exercise:", error);
    }
  };

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Update Exercise
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Update the details of the exercise.
          </p>
        </div>

        <div className="mt-6">
          <UpdateExerciseForm exercise={exercise} />
        </div>
      </div>
    </div>
  );
};

export default Page;
