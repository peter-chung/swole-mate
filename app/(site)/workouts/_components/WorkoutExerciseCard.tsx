import React from "react";
import SetCard from "./SetCard";

type Props = {
  we: {
    id: string;
    order_index: number | null;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
      exercise_type_label: string | null;
    } | null;
    exercise_sets: Array<{
      id: string;
      set_number: number | null;
      reps: number | null;
      weight: number | null;
      duration: number | null;
      distance: number | null;
      notes: string | null;
    }>;
  };
};

const WorkoutExerciseCard = ({ we }: Props) => {
  return (
    <li
      key={we.id}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {we.exercise?.name ?? "Exercise"}
          </p>
          {we.exercise?.exercise_type_label && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700">
                {we.exercise.exercise_type_label}
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
              // <li
              //   key={set.id}
              //   className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-neutral-900"
              // >
              //   <div className="flex items-center justify-between">
              //     <span className="font-medium text-gray-900 dark:text-gray-100">
              //       Set {set.set_number ?? "-"}
              //     </span>
              //     <span className="text-gray-600 dark:text-gray-300">
              //       {set.reps != null
              //         ? `${set.reps} reps`
              //         : set.duration != null
              //         ? `${set.duration}s`
              //         : set.distance != null
              //         ? `${set.distance}m`
              //         : ""}
              //       {set.weight != null ? ` @ ${set.weight} lbs` : ""}
              //     </span>
              //   </div>
              //   {set.notes && (
              //     <p className="mt-1 text-gray-600 dark:text-gray-300">
              //       {set.notes}
              //     </p>
              //   )}
              // </li>
              <SetCard key={set.id} set={set} />
            ))}
        </ul>
      )}
    </li>
  );
};

export default WorkoutExerciseCard;
