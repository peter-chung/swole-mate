import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRoutineWithRelations } from "../_lib/getRoutine";
import RoutineDetailCard from "../_components/RoutineDetailCard";
import RoutineExerciseContainer from "../_components/RoutineExerciseContainer";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function RoutineDetailPage({ params }: Props) {
  const { id } = await params;
  const routine = await getRoutineWithRelations(id);

  if (!routine) notFound();

  const ownerName =
    routine.user?.username ?? routine.user?.full_name ?? "Unknown";

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Link
          href="/routines"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to routines</span>
        </Link>

        <div className="mt-3 space-y-6">
          <RoutineDetailCard routine={routine} ownerName={ownerName} />
          <RoutineExerciseContainer routine={routine} />
        </div>
      </div>
    </div>
  );
}
