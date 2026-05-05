const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-neutral-800 ${className}`} />
);

export default Skeleton;
