import Link from "next/link";
import { prettyDate } from "@/utils/format";
import type { Tables } from "@/types/database.types";

type Workout = Tables<"workouts">;
type Props = { workout: Workout; ownerName: string };

const WorkoutDetailCard = ({ workout, ownerName }: Props) => {
  return (
    <>
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Workout Details
      </h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {workout.name || "Untitled workout"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <span>{prettyDate(workout?.date)}</span>
              <span className="mx-2">•</span>
              <span>By {ownerName}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/workouts/${workout.id}/add-exercise`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              + Add exercise
            </Link>
            <Link
              href={`/workouts/${workout.id}/edit`}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              Edit
            </Link>
          </div>
        </div>
        {workout.notes && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {workout.notes}
          </p>
        )}
      </div>
    </>
  );
};

export default WorkoutDetailCard;
