import { cn } from "../utils/cn";

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
