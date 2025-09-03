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
    <div>
      <h1 className="">{exercise?.name}</h1>
      <p className="mb-4">{exercise?.type}</p>
      <p className="mb-4">{exercise?.primary_muscle}</p>
      <p className="mb-4">{exercise?.other_muscles}</p>

      <button className="text-red-700" onClick={handleDelete}>
        Delete
      </button>

      <p>Edit Exercise Form</p>
      <UpdateExerciseForm exercise={exercise} />
    </div>
  );
};

export default Page;
