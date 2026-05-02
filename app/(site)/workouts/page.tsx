import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import WorkoutsListClient from "./_components/WorkoutsListClient";
import { getWorkoutsList } from "./_lib/getWorkoutsList";

export const dynamic = "force-dynamic";

const Page = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workouts = await getWorkoutsList(user.id);

  return (
    <WorkoutsListClient
      initialWorkouts={workouts}
      isAuthenticated={true}
      mode="mine"
    />
  );
};

export default Page;
