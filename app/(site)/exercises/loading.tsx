import Skeleton from "@/app/_components/Skeleton";
import ExerciseCardSkeleton from "./_components/ExerciseCardSkeleton";

const ExercisesLoading = () => (
  <div className="py-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="hidden h-9 w-36 rounded-lg sm:block" />
    </div>
    <Skeleton className="mt-4 h-10 w-full rounded-lg" />
    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <ExerciseCardSkeleton key={i} />
      ))}
    </ul>
  </div>
);

export default ExercisesLoading;
