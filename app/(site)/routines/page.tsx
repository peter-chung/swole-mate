import RoutinesListClient from "./_components/RoutinesListClient";
import { getRoutinesList } from "./_lib/getRoutinesList";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const routines = await getRoutinesList();
  return <RoutinesListClient initialRoutines={routines} />;
}
