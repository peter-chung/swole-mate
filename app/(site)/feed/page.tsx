import { createClient } from "@/utils/supabase/server";
import WorkoutsListClient from "../workouts/_components/WorkoutsListClient";
import { getWorkoutsList } from "../workouts/_lib/getWorkoutsList";

export const dynamic = "force-dynamic";

const FeedPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const workouts = await getWorkoutsList();

  return (
    <WorkoutsListClient
      initialWorkouts={workouts}
      isAuthenticated={!!user}
      mode="feed"
    />
  );
};

export default FeedPage;
