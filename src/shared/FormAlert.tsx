type FormAlertProps = {
  message: string;
  variant?: "error" | "success";
  className?: string;
};

export function FormAlert({ message, variant = "error", className = "" }: FormAlertProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`rounded border px-3 py-2 text-sm ${
        variant === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-700"
      } ${className}`}
    >
      {message}
    </div>
  );
}
