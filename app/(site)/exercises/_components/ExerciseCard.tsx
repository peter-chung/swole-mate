"use client";

import React from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";

type Exercise = Tables<"exercises">;

const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const muscle = exercise.primary_muscle || "Unknown";
  return (
    <li className="h-full">
      <Link
        href={`/exercises/${exercise.id}`}
        className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-gray-800 dark:bg-neutral-900"
      >
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 transition group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
                {exercise.name}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                  {muscle}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-end justify-end">
            <span className="inline-flex items-center text-xs font-medium text-gray-500 transition group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-300">
              Details →
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default ExerciseCard;
