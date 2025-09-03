"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Tables } from "@/types/database.types";
import UpdatedWorkoutForm from "@/app/workouts/_components/UpdatedWorkoutForm";

type Workout = Tables<"workouts">;

const EditWorkoutPage = () => {
  const { id: workoutId } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/workouts/${workoutId}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setWorkout(result.data);
      } catch (err) {
        console.error("Error fetching workout:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Edit Workout</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <UpdatedWorkoutForm workout={workout} />
      )}
    </div>
  );
};

export default EditWorkoutPage;
