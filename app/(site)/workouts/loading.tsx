import Skeleton from "@/app/_components/Skeleton";
import WorkoutCardSkeleton from "./_components/WorkoutCardSkeleton";

const WorkoutsLoading = () => (
  <div className="py-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
    <Skeleton className="mt-6 h-4 w-28" />
    <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <WorkoutCardSkeleton key={i} />
      ))}
    </ul>
  </div>
);

export default WorkoutsLoading;
