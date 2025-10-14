import WorkoutsListClient from "./_components/WorkoutsListClient";
import { getWorkoutsList } from "./_lib/getWorkoutsList";

const Page = async () => {
  const workouts = await getWorkoutsList();

  return <WorkoutsListClient initialWorkouts={workouts} />;
};

export default Page;
