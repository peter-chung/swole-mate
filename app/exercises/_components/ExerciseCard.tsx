"use client";

import React from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";

type Exercise = Tables<"exercises">;

const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  return (
    <li className="border border-gray-500 mb-2">
      <p>{exercise.name}</p>
      <p>{exercise.primary_muscle}</p>

      <Link className="text-blue-500" href={`/exercises/${exercise.id}`}>
        Edit
      </Link>
    </li>
  );
};

export default ExerciseCard;
