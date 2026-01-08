import Link from "next/link";
import { notFound } from "next/navigation";
import EditRoutineForm from "../../_components/EditRoutineForm";
import { getRoutineWithRelations } from "../../_lib/getRoutine";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRoutinePage({ params }: PageProps) {
  const { id } = await params;
  const routine = await getRoutineWithRelations(id);

  if (!routine) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={`/routines/${routine.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to routine</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Routine
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {routine.name ? (
            <span className="truncate">{routine.name}</span>
          ) : (
            routine.date && <span className="truncate">{routine.date}</span>
          )}
          {routine.status && (
            <span className="inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {routine.status}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
        <EditRoutineForm routine={routine} />
      </section>
    </div>
  );
}
