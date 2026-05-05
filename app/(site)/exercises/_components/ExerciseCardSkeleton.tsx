import Skeleton from "@/app/_components/Skeleton";

const cardClasses =
  "flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900";

const ExerciseCardSkeleton = () => (
  <li className="h-full">
    <div className={cardClasses}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </li>
);

export default ExerciseCardSkeleton;
