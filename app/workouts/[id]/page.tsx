"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Tables } from "@/types/database.types";
import UpdatedWorkoutForm from "../_components/UpdatedWorkoutForm";
import Link from "next/link";

type Workout = Tables<"workouts">;

const Page = () => {
  const { id: workoutId } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);


  const fetchWorkout = async () => {
    try {
      const res = await fetch(`/api/workouts/${workoutId}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      setWorkout(result.data);
    } catch (error) {
      console.error("Error fetching exercise:", error);
    }
  };

  useEffect(() => {
    fetchWorkout();
  }, []);

  return (
    <div>
      <h1 className="">Title: {workout?.name}</h1>
      <p className="mt-4">Date: {workout?.date}</p>
      <p>Notes: {workout?.notes}</p>

      <Link
        href={workout ? `/workouts/${workout.id}/edit` : "/workouts"}
        className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-800/70"
      >
        Edit Workout
      </Link>
    </div>
  );
};

export default Page;
