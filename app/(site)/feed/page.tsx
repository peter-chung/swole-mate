import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import Skeleton from "@/app/_components/Skeleton";
import WorkoutsListClient from "../workouts/_components/WorkoutsListClient";
import WorkoutCardSkeleton from "../workouts/_components/WorkoutCardSkeleton";
import { getWorkoutsList } from "../workouts/_lib/getWorkoutsList";

export const dynamic = "force-dynamic";

async function FeedList({ isAuthenticated }: { isAuthenticated: boolean }) {
  const workouts = await getWorkoutsList();
  return <WorkoutsListClient initialWorkouts={workouts} isAuthenticated={isAuthenticated} mode="feed" />;
}

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Feed
      </h1>
      <Suspense
        fallback={
          <div className="mt-4 space-y-6">
            <div>
              <Skeleton className="mb-3 h-4 w-28" />
              <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <WorkoutCardSkeleton key={i} />
                ))}
              </ul>
            </div>
          </div>
        }
      >
        <FeedList isAuthenticated={!!user} />
      </Suspense>
    </div>
  );
}
