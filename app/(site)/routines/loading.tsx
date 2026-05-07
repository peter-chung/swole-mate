import Skeleton from "@/app/_components/Skeleton";
import RoutineCardSkeleton from "./_components/RoutineCardSkeleton";

const RoutinesLoading = () => (
  <div className="py-6">
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-9 w-full rounded-lg sm:w-32" />
    </div>
    <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <RoutineCardSkeleton key={i} />
      ))}
    </ul>
  </div>
);

export default RoutinesLoading;
