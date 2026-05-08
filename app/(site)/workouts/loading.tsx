import Skeleton from "@/app/_components/Skeleton";
import WorkoutCardSkeleton from "./_components/WorkoutCardSkeleton";

const WorkoutsLoading = () => (
  <div className="py-6">
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-9 w-full rounded-lg sm:w-32" />
    </div>
    <div className="mt-4 space-y-6">
      <div>
        <Skeleton className="mb-3 h-4 w-28" />
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WorkoutCardSkeleton key={i} />
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default WorkoutsLoading;
