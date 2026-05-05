import Skeleton from "@/app/_components/Skeleton";

const WorkoutCardSkeleton = () => (
  <li className="h-full">
    <div className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-1/2" />
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-neutral-800">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-1 h-3 w-full" />
      </div>
    </div>
  </li>
);

export default WorkoutCardSkeleton;
