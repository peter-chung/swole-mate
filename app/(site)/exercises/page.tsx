import { createClient } from "@/utils/supabase/server";
import ExercisesListClient from "./_components/ExercisesListClient";
import { getInitialExercises } from "./_lib/getExercisesList";

export const dynamic = "force-dynamic";

const Page = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { items, count } = await getInitialExercises();

  return (
    <ExercisesListClient
      initialExercises={items}
      initialCount={count}
      initialQuery=""
      isAuthenticated={!!user}
    />
  );
};

export default Page;
