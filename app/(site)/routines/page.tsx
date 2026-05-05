import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ButtonLink } from "@/app/_components/Button";
import RoutinesListClient from "./_components/RoutinesListClient";
import RoutineCardSkeleton from "./_components/RoutineCardSkeleton";
import { getRoutinesList } from "./_lib/getRoutinesList";

export const dynamic = "force-dynamic";

async function RoutinesList({ isAuthenticated }: { isAuthenticated: boolean }) {
  const routines = isAuthenticated ? await getRoutinesList() : [];
  return <RoutinesListClient initialRoutines={routines} isAuthenticated={isAuthenticated} />;
}

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Routines
        </h1>
        <ButtonLink href="/routines/new" variant="primary" className="w-full gap-1.5 sm:w-auto">
          <Plus className="h-4 w-4" />
          New Routine
        </ButtonLink>
      </div>
      <Suspense
        fallback={
          <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RoutineCardSkeleton key={i} />
            ))}
          </ul>
        }
      >
        <RoutinesList isAuthenticated={!!user} />
      </Suspense>
    </div>
  );
}
