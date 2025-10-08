import { notFound } from "next/navigation";
import ManageExercisesClient from "./ManageExercisesClient";
import { getWorkoutWithRelations } from "../../../_lib/getWorkout";

type PageProps = {
  params: { id: string };
};

export default async function ManageExercisesPage({ params }: PageProps) {
  const workout = await getWorkoutWithRelations(params.id);
  if (!workout) notFound();

  return <ManageExercisesClient workout={workout} />;
}
