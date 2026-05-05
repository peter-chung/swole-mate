import React from "react";
import type { WorkoutWithRelations } from "../_lib/getWorkout";

type Props = {
  workout: WorkoutWithRelations;
};

const WorkoutExercisesDetails = ({ workout }: Props) => {
  return (
    <div>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Exercises
        </h2>
      </div>
      {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
        <ul className="-mx-4 divide-y divide-gray-100 dark:divide-neutral-800 sm:mx-0 sm:grid sm:grid-cols-1 sm:gap-3 sm:divide-y-0">
          {workout.workout_exercises
            .slice()
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((we) => (
              <li
                key={we.id}
                className="px-4 py-4 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:p-4 sm:shadow-sm sm:dark:border-neutral-800 sm:dark:bg-neutral-900"
              >
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {we.exercise?.name ?? "Exercise"}
                  </p>
                  {(we.exercise?.primary_muscle || we.exercise?.exercise_type_label || we.equipment_brand) && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {we.exercise?.primary_muscle && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40">
                          Primary · {we.exercise.primary_muscle}
                        </span>
                      )}
                      {we.exercise?.exercise_type_label && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/30">
                          {we.exercise.exercise_type_label}
                        </span>
                      )}
                      {we.equipment_brand && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                          {we.equipment_brand}
                        </span>
                      )}
                    </div>
                  )}
                  {we.notes && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                      {we.notes}
                    </p>
                  )}
                </div>

                {we.exercise_sets && we.exercise_sets.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                    {we.exercise_sets
                      .slice()
                      .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
                      .map((set) => {
                        const value = [
                          set.weight != null ? `${set.weight} lbs` : null,
                          set.reps != null ? `${set.reps} reps` : set.duration != null ? `${set.duration}s` : set.distance != null ? `${set.distance}m` : null,
                        ].filter(Boolean).join(" × ");
                        return (
                          <li key={set.id} className="flex flex-col gap-0.5 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-neutral-800">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Set {set.set_number ?? "-"}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {value || "—"}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-neutral-700 dark:text-gray-300">
          <p className="font-medium">No exercises yet</p>
          <p className="text-sm">Add your first exercise to this workout.</p>
        </div>
      )}
    </div>
  );
};

export default WorkoutExercisesDetails;
