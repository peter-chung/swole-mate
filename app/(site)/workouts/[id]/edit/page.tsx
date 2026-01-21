import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditWorkoutForm from "../../_components/EditWorkoutForm";
import { getWorkoutWithRelations } from "../../_lib/getWorkout";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkoutPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const workout = await getWorkoutWithRelations(id);

  if (!workout || workout.user_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={`/workouts/${workout.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to workout</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Workout
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {workout.name ? (
            <span className="truncate">{workout.name}</span>
          ) : (
            workout.date && <span className="truncate">{workout.date}</span>
          )}
          {workout.status && (
            <span className="inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {workout.status}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
        <EditWorkoutForm workout={workout} />
      </section>

      <section className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white/40 p-4 text-sm dark:border-gray-700 dark:bg-gray-900/30 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-gray-700 dark:text-gray-300">
            Need to adjust exercises or sets for this workout?
          </div>
          <Link
            href={`/workouts/${workout.id}/exercises/edit`}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px"
          >
            Manage Exercises
          </Link>
        </div>
      </section>
    </div>
  );
}
