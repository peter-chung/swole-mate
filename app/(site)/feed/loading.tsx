import Skeleton from "@/app/_components/Skeleton";
import WorkoutCardSkeleton from "../workouts/_components/WorkoutCardSkeleton";

const FeedLoading = () => (
  <div className="py-6">
    <Skeleton className="h-8 w-16" />
    <Skeleton className="mt-6 h-4 w-28" />
    <ul className="mt-3 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <WorkoutCardSkeleton key={i} />
      ))}
    </ul>
  </div>
);

export default FeedLoading;
