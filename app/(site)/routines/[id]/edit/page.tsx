import { notFound } from "next/navigation";
import { getRoutineWithRelations } from "../../_lib/getRoutine";
import ManageExercisesClient from "../exercises/edit/ManageExercisesClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRoutinePage({ params }: PageProps) {
  const { id } = await params;
  const routine = await getRoutineWithRelations(id);

  if (!routine) notFound();

  return <ManageExercisesClient routine={routine} />;
}
