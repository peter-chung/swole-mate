import ExercisesListClient from "./_components/ExercisesListClient";
import { getInitialExercises } from "./_lib/getExercisesList";

const Page = async () => {
  const { items, count } = await getInitialExercises();

  return (
    <ExercisesListClient
      initialExercises={items}
      initialCount={count}
      initialQuery=""
    />
  );
};

export default Page;
