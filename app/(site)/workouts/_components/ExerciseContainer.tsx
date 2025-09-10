import React from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";

type WorkoutRow = Tables<"workouts">;
type WorkoutExerciseDto = {
  id: string | number;
  order_index: number | null;
  notes: string | null;
  exercise: { id: string | number; name: string; type: string | null } | null;
  exercise_sets: Array<{
    id: string | number;
    set_number: number | null;
    reps: number | null;
    weight: number | null;
    duration: number | null;
    distance: number | null;
    notes: string | null;
  }>;
};
type WorkoutWithExercises = WorkoutRow & {
  workout_exercises?: WorkoutExerciseDto[];
};
type Props = { workout: WorkoutWithExercises };

const WorkoutExercisesDetails = ({ workout }: Props) => {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Exercises
      </h2>
      {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3">
          {workout.workout_exercises
            .slice()
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((we) => (
              <li
                key={we.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {we.exercise?.name ?? "Exercise"}
                    </p>
                    {we.exercise?.type && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                          {we.exercise.type}
                        </span>
                      </p>
                    )}
                    {we.notes && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                        {we.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {we.exercise_sets?.length || 0} sets
                  </span>
                </div>

                {we.exercise_sets && we.exercise_sets.length > 0 && (
                  <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {we.exercise_sets
                      .slice()
                      .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
                      .map((set) => (
                        <li
                          key={set.id}
                          className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-neutral-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Set {set.set_number ?? "-"}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {set.reps != null
                                ? `${set.reps} reps`
                                : set.duration != null
                                ? `${set.duration}s`
                                : set.distance != null
                                ? `${set.distance}m`
                                : ""}
                              {set.weight != null ? ` @ ${set.weight} lbs` : ""}
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
                )}
              </li>
            ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <p className="font-medium">No exercises yet</p>
          <p className="text-sm">Add your first exercise to this workout.</p>
          <div className="mt-4">
            <Link
              href={`/workouts/${workout.id}/add-exercise`}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              + Add exercise
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutExercisesDetails;
