"use client";

import React from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";

type Exercise = Tables<"exercises">;

const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const muscle = exercise.primary_muscle || "Unknown";
  return (
    <li className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {exercise.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
              {muscle}
            </span>
          </p>
        </div>
        <Link
          href={`/exercises/${exercise.id}`}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 transition group-hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:group-hover:bg-gray-900/40"
        >
          View
        </Link>
      </div>
    </li>
  );
};

export default ExerciseCard;
