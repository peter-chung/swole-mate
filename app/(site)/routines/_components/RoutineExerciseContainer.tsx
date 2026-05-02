import React from "react";
import type { RoutineWithRelations } from "../_lib/getRoutine";

type Props = { routine: RoutineWithRelations };

export default function RoutineExerciseContainer({ routine }: Props) {
  const exercises = routine.routine_exercises ?? [];

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Exercises
        </h2>
      </div>

      {exercises.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3">
          {exercises
            .slice()
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((re) => (
              <li
                key={re.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {re.exercise?.name ?? "Exercise"}
                  </p>
                  {(re.exercise?.primary_muscle || re.exercise?.exercise_type_label || re.equipment_brand) && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {re.exercise?.primary_muscle && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40">
                          Primary · {re.exercise.primary_muscle}
                        </span>
                      )}
                      {re.exercise?.exercise_type_label && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/30">
                          {re.exercise.exercise_type_label}
                        </span>
                      )}
                      {re.equipment_brand && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                          {re.equipment_brand}
                        </span>
                      )}
                    </div>
                  )}
                  {re.notes && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                      {re.notes}
                    </p>
                  )}
                </div>

                {re.routine_sets && re.routine_sets.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                    {re.routine_sets
                      .slice()
                      .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
                      .map((set) => {
                        const value = [
                          set.weight != null ? `${set.weight} lbs` : null,
                          set.reps != null
                            ? `${set.reps} reps`
                            : set.duration != null
                            ? `${set.duration}s`
                            : set.distance != null
                            ? `${set.distance}m`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" × ");
                        return (
                          <li key={set.id} className="flex flex-col gap-0.5 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-neutral-800">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Set {set.set_number ?? "-"}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {value || "—"}
                            </span>
                            {set.notes && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {set.notes}
                              </span>
                            )}
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
          <p className="text-sm">Use "Edit" to add exercises to this routine.</p>
        </div>
      )}
    </div>
  );
}
