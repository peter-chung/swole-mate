import { createClient } from "@/utils/supabase/server";
import WorkoutsListClient from "./_components/WorkoutsListClient";
import { getWorkoutsList } from "./_lib/getWorkoutsList";

export const dynamic = "force-dynamic";

const Page = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const workouts = await getWorkoutsList();

  return (
    <WorkoutsListClient
      initialWorkouts={workouts}
      isAuthenticated={!!user}
    />
  );
};

export default Page;
