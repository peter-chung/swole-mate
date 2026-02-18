import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getWorkoutWithRelations } from "../../_lib/getWorkout";
import EditWorkoutClient from "./EditWorkoutClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkoutPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const workout = await getWorkoutWithRelations(id);

  if (!workout || workout.user_id !== user.id) notFound();

  return <EditWorkoutClient workout={workout} />;
}
