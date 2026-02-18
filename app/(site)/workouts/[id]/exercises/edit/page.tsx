import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ManageExercisesClient from "./ManageExercisesClient";
import { getWorkoutWithRelations } from "../../../_lib/getWorkout";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManageExercisesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const workout = await getWorkoutWithRelations(id);
  if (!workout || workout.user_id !== user.id) notFound();

  return <ManageExercisesClient workout={workout} />;
}
