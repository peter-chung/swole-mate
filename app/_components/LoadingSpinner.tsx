import React from "react";

type LoadingSpinnerProps = {
  label?: string | null;
  className?: string;
  spinnerClassName?: string;
  style?: React.CSSProperties;
};

const baseContainerClasses =
  "flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400";
const baseSpinnerClasses =
  "inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-200";

const LoadingSpinner = ({
  label = "Loading…",
  className = "",
  spinnerClassName = "",
  style,
}: LoadingSpinnerProps) => {
  return (
    <div
      className={`max-w-md ${baseContainerClasses} ${className}`.trim()}
      role="status"
      style={style}
    >
      <span
        className={`${baseSpinnerClasses} ${spinnerClassName}`.trim()}
        aria-hidden
      />
      {label ? <span>{label}</span> : null}
    </div>
  );
};

export default LoadingSpinner;
