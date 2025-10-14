import { notFound } from "next/navigation";
import ManageExercisesClient from "./ManageExercisesClient";
import { getWorkoutWithRelations } from "../../../_lib/getWorkout";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManageExercisesPage({ params }: PageProps) {
  const { id } = await params;
  const workout = await getWorkoutWithRelations(id);
  if (!workout) notFound();

  return <ManageExercisesClient workout={workout} />;
}
