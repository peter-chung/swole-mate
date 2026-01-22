import { createClient } from "@/utils/supabase/server";
import RoutinesListClient from "./_components/RoutinesListClient";
import { getRoutinesList } from "./_lib/getRoutinesList";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const routines = user ? await getRoutinesList() : [];
  return (
    <RoutinesListClient
      initialRoutines={routines}
      isAuthenticated={!!user}
    />
  );
}
