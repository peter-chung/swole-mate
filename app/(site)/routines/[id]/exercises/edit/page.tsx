import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function ManageExercisesPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/routines/${id}/edit`);
}
