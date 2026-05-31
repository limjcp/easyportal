import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type AdminSectionPanelProps = {
  title: string;
  children: ReactNode;
  variant?: "primary" | "purple";
  icon?: ReactNode;
  className?: string;
};

export function AdminSectionPanel({
  title,
  children,
  variant = "purple",
  icon,
  className,
}: AdminSectionPanelProps) {
  return (
    <div className={cn("overflow-hidden rounded-sm border border-slate-200 bg-white", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white",
          variant === "primary" ? "bg-[#3476ef]" : "bg-[#7D5DA7]"
        )}
      >
        {icon}
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
