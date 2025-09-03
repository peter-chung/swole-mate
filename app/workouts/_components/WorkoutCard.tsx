"use client";

import React from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";

type Workout = Tables<"workouts">;

const WorkoutCard = ({ workout }: { workout: Workout }) => {
  const { name, date } = workout;

  return (
    <li className="border border-gray-500 mb-2">
      <p>{name}</p>
      <p>{date}</p>

      <Link className="text-blue-500" href={`/workouts/${workout.id}`}>
        Edit
      </Link>
    </li>
  );
};

export default WorkoutCard;
