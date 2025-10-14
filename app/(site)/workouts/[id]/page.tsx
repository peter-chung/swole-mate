import Link from "next/link";
import { notFound } from "next/navigation";
import WorkoutDetailCard from "../_components/WorkoutDetailCard";
import ExerciseContainer from "../_components/ExerciseContainer";
import { getWorkoutWithRelations } from "../_lib/getWorkout";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkoutPage({ params }: PageProps) {
  const { id } = await params;
  const workout = await getWorkoutWithRelations(id);

  if (!workout) notFound();

  const ownerName =
    workout.user?.username ?? workout.user?.full_name ?? "Unknown";

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Link
          href="/workouts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to workouts</span>
        </Link>

        <div className="mt-3 space-y-6">
          <WorkoutDetailCard workout={workout} ownerName={ownerName} />
          <ExerciseContainer workout={workout} />
        </div>
      </div>
    </div>
  );
}
