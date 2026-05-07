import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import EditExerciseForm from "../../../_components/EditExerciseForm";
import type { Database, Tables } from "@/types/database.types";

type PageProps = { params: Promise<{ exerciseId: string }> };

export default async function Page({ params }: PageProps) {
  const { exerciseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) notFound();

  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: publicExercise, error } = await serviceClient
    .from("public_exercises")
    .select("*, exercise_types(label, key)")
    .eq("id", exerciseId)
    .single();

  if (error || !publicExercise) notFound();

  const exercise = {
    id: publicExercise.id,
    name: publicExercise.name,
    primary_muscle: publicExercise.primary_muscle ?? null,
    other_muscles: publicExercise.other_muscles ?? null,
    exercise_type_id: publicExercise.exercise_type_id,
    exercise_type_label: (publicExercise.exercise_types as { label: string; key: string } | null)?.label ?? null,
    exercise_type_key: (publicExercise.exercise_types as { label: string; key: string } | null)?.key ?? null,
    user_id: "",
    created_at: publicExercise.created_at,
  } as Tables<"custom_exercises"> & {
    exercise_type_label?: string | null;
    exercise_type_key?: string | null;
  };

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
            Edit Public Exercise
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Changes will be visible to all SwoleMate users.
          </p>
        </div>

        <div className="mt-6 mx-auto w-full max-w-md">
          <EditExerciseForm exercise={exercise} resourceId={exerciseId} isPublic />
        </div>
      </div>
    </div>
  );
}
