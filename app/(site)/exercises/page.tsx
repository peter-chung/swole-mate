import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ButtonLink } from "@/app/_components/Button";
import Skeleton from "@/app/_components/Skeleton";
import ExercisesListClient from "./_components/ExercisesListClient";
import ExerciseCardSkeleton from "./_components/ExerciseCardSkeleton";
import { getInitialExercises } from "./_lib/getExercisesList";

export const dynamic = "force-dynamic";

async function ExercisesList({
  isAdmin,
  isAuthenticated,
}: {
  isAdmin: boolean;
  isAuthenticated: boolean;
}) {
  const { items, count } = await getInitialExercises();
  return (
    <ExercisesListClient
      initialExercises={items}
      initialCount={count}
      initialQuery=""
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
    />
  );
}

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  return (
    <div className="py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Exercises
        </h1>
        <div className="hidden sm:flex sm:items-center sm:gap-2">
          {isAdmin && (
            <ButtonLink href="/exercises/new/public" variant="secondary" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Public Exercise
            </ButtonLink>
          )}
          <ButtonLink href="/exercises/new" variant="primary" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Exercise
          </ButtonLink>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:hidden">
        {isAdmin && (
          <ButtonLink href="/exercises/new/public" variant="secondary" className="w-full gap-1.5">
            <Plus className="h-4 w-4" />
            New Public Exercise
          </ButtonLink>
        )}
        <ButtonLink href="/exercises/new" variant="primary" className="w-full gap-1.5">
          <Plus className="h-4 w-4" />
          New Exercise
        </ButtonLink>
      </div>
      <Suspense
        fallback={
          <>
            <Skeleton className="mt-4 h-10 w-full rounded-lg" />
            <ul className="mt-6 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ExerciseCardSkeleton key={i} />
              ))}
            </ul>
          </>
        }
      >
        <ExercisesList isAdmin={isAdmin} isAuthenticated={!!user} />
      </Suspense>
    </div>
  );
}
