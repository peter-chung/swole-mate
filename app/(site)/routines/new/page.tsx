import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateRoutineForm from "../_components/CreateRoutineForm";

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/routines"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to routines
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Create Routine
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Set a name, date, and optional notes to get started.
          </p>
        </div>

        <div className="mt-6">
          <CreateRoutineForm />
        </div>
      </div>
    </div>
  );
};

export default Page;
