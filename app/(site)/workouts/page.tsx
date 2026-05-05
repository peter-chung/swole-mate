import { Suspense } from "react";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ButtonLink } from "@/app/_components/Button";
import Skeleton from "@/app/_components/Skeleton";
import WorkoutsListClient from "./_components/WorkoutsListClient";
import WorkoutCardSkeleton from "./_components/WorkoutCardSkeleton";
import { getWorkoutsList } from "./_lib/getWorkoutsList";

export const dynamic = "force-dynamic";

async function WorkoutsList({ userId }: { userId: string }) {
  const workouts = await getWorkoutsList(userId);
  return <WorkoutsListClient initialWorkouts={workouts} isAuthenticated mode="mine" />;
}

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          My Workouts
        </h1>
        <ButtonLink href="/workouts/new" variant="primary" className="w-full gap-1.5 sm:w-auto">
          <Plus className="h-4 w-4" />
          New Workout
        </ButtonLink>
      </div>
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
        <WorkoutsList userId={user.id} />
      </Suspense>
    </div>
  );
}
