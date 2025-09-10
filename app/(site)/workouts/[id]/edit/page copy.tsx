"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Tables } from "@/types/database.types";
import EditWorkoutForm from "../../_components/EditWorkoutForm";
import AddExerciseForm from "../../_components/AddWorkoutExerciseModal";

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
        console.log("Fetched workout:", result.data);
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
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Edit Workout
      </h2>
      {/* <EditWorkoutForm workout={workout} /> */}
      <AddExerciseForm
        workoutId={workout?.id}
        exercises={workout?.workout_exercises}
      />
    </div>
  );
};

export default EditWorkoutPage;
