import { FaSpinner } from "react-icons/fa";
import { cn } from "../utils/cn";

type ActionButtonVariant = "primary" | "secondary" | "danger" | "success";

type ActionButtonProps = {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: ActionButtonVariant;
  type?: "button" | "submit";
  form?: string;
  className?: string;
  onClick?: () => void;
};

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "bg-[#3476ef] text-white hover:bg-[#2d68cf]",
  secondary: "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-[#5cb85c] text-white hover:bg-[#449d44]",
};

export function ActionButton({
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  variant = "primary",
  type = "button",
  form,
  className,
  onClick,
}: ActionButtonProps) {
  const isDisabled = disabled || loading;
  const displayLabel = loading ? (loadingLabel ?? `${label}…`) : label;

  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium disabled:opacity-60",
        variantClasses[variant],
        className
      )}
    >
      {loading ? <FaSpinner className="animate-spin text-xs" aria-hidden /> : null}
      {displayLabel}
    </button>
  );
}
