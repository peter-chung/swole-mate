import React from "react";

type Props = {
  set: {
    id: string;
    set_number: number | null;
    reps: number | null;
    weight: number | null;
    duration: number | null;
    distance: number | null;
    notes: string | null;
  };
};

const SetCard = ({ set }: Props) => {
  return (
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
        <p className="mt-1 text-gray-600 dark:text-gray-300">{set.notes}</p>
      )}
    </li>
  );
};

export default SetCard;
