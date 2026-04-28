import React from "react";
import Link from "next/link";
import type { RoutineWithRelations } from "../_lib/getRoutine";

type Props = { routine: RoutineWithRelations };

export default function RoutineExerciseContainer({ routine }: Props) {
  const exercises = routine.routine_exercises ?? [];

  return (
    <div>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Exercises
        </h2>
        <Link
          href={`/routines/${routine.id}/exercises/edit`}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4.5 9.75v4.5M19.5 9.75v4.5" />
            <path d="M7.5 6.75v10.5M16.5 6.75v10.5" />
            <path d="M9.75 12h4.5" />
          </svg>
          <span>Manage exercises</span>
        </Link>
      </div>

      {exercises && exercises.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3">
          {exercises
            .slice()
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((re) => (
              <li
                key={re.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {re.exercise?.name ??
                        (re.custom_exercise_id ? "Custom" : "Exercise")}
                    </p>
                    {re.equipment_brand && (
                      <p className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40">
                          Brand: {re.equipment_brand}
                        </span>
                      </p>
                    )}
                    {re.notes && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                        {re.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {re.routine_sets?.length || 0} sets
                  </span>
                </div>

                {re.routine_sets && re.routine_sets.length > 0 && (
                  <div className="mt-1">
                    <div className="mb-1">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                        Weight & Reps
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {re.routine_sets
                        .slice()
                        .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
                        .map((set) => (
                        <li
                          key={set.id}
                          className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-neutral-900"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Set {set.set_number ?? "-"}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {set.weight != null ? `${set.weight} lbs` : ""}
                              {set.weight != null &&
                              (set.reps != null ||
                                set.duration != null ||
                                set.distance != null)
                                ? " × "
                                : ""}
                              {set.reps != null
                                ? `${set.reps} reps`
                                : set.duration != null
                                ? `${set.duration}s`
                                : set.distance != null
                                ? `${set.distance}m`
                                : ""}
                            </span>
                          </div>
                          {set.notes && (
                            <p className="mt-1 text-gray-600 dark:text-gray-300">
                              {set.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <p className="font-medium">No exercises yet</p>
          <p className="text-sm">Add your first exercise to this routine.</p>
          <div className="mt-4">
            <Link
              href={`/routines/${routine.id}/exercises/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M4.5 9.75v4.5M19.5 9.75v4.5" />
                <path d="M7.5 6.75v10.5M16.5 6.75v10.5" />
                <path d="M9.75 12h4.5" />
              </svg>
              <span>Manage exercises</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

