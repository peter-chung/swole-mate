import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CreateExerciseForm from "../../_components/CreateExerciseForm";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) notFound();

  return (
    <div className="py-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/exercises"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to exercises
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Create Public Exercise
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            This exercise will be visible to all SwoleMate users.
          </p>
        </div>

        <div className="mt-6">
          <CreateExerciseForm isPublic />
        </div>
      </div>
    </div>
  );
}
