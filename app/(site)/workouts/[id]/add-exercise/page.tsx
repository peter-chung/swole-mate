// app/(site)/workouts/[id]/add-exercise/page.tsx
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AddExerciseForm from "../../_components/AddWorkoutExerciseModal";

type Params = { params: Promise<{ id: string }> };

export default async function AddExercisePage({ params }: Params) {
  const { id: workoutId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ensure the workout belongs to this user
  const { data: workout } = await supabase
    .from("workouts")
    .select("id, user_id, status")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (!workout) notFound();

  const { data: exercises, error: exErr } = await supabase
    .from("available_exercises")
    .select("id, name, exercise_type_label")
    .order("name", { ascending: true });

  if (exErr) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Add Exercise</h1>
        <p className="text-red-500">
          Could not load exercises: {exErr.message}
        </p>
        <Link
          className="underline mt-4 inline-block"
          href={`/workouts/${workoutId}`}
        >
          Back to workout
        </Link>
      </div>
    );
  }

  // Import the client component
  // const AddExerciseForm = (await import("./AddExerciseForm")).default;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Add exercise</h1>
      <p className="text-sm text-gray-500 mb-6">
        Pick an exercise to add to this workout. You can add sets on the next
        screen.
      </p>
      <AddExerciseForm
        workoutId={workoutId}
        exercises={(exercises ?? []).map((exercise) => ({
          ...exercise,
          type: exercise.exercise_type_label,
        }))}
      />
      <div className="mt-6">
        <Link className="text-sm underline" href={`/workouts/${workoutId}`}>
          Cancel
        </Link>
      </div>
    </div>
  );
}
