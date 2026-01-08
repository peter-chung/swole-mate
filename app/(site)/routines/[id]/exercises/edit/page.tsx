import { notFound } from "next/navigation";
import ManageExercisesClient from "./ManageExercisesClient";
import { getRoutineWithRelations } from "../../../_lib/getRoutine";

type PageProps = { params: Promise<{ id: string }> };

export default async function ManageExercisesPage({ params }: PageProps) {
  const { id } = await params;
  const routine = await getRoutineWithRelations(id);
  if (!routine) notFound();

  return <ManageExercisesClient routine={routine} />;
}
