import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type AdminFormPanelProps = {
  title: string;
  icon?: ReactNode;
  toolbar?: ReactNode;
  headerColor?: "default" | "primary" | "purple";
  children: ReactNode;
  className?: string;
};

export function AdminFormPanel({
  title,
  icon,
  toolbar,
  headerColor = "default",
  children,
  className,
}: AdminFormPanelProps) {
  return (
    <div className={cn("overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm", className)}>
      <div
        className={cn(
          "flex items-center justify-between border-b border-slate-200 px-4 py-2",
          headerColor === "primary"
            ? "bg-[#3476ef] text-white"
            : headerColor === "purple"
              ? "bg-[#8e44ad] text-white"
              : "bg-slate-50"
        )}
      >
        <h3
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            headerColor === "primary" || headerColor === "purple" ? "text-white" : "text-slate-700"
          )}
        >
          {icon}
          {title}
        </h3>
        {toolbar}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function InfoBanner({ title, subtitle, icon }: { title: string; subtitle: string; icon?: ReactNode }) {
  return (
    <div className="mx-auto mb-6 max-w-3xl rounded border border-sky-200 bg-sky-50 px-6 py-4 text-center">
      <h4 className="flex items-center justify-center gap-2 font-semibold text-sky-800">
        {icon}
        {title}
      </h4>
      <p className="mt-1 text-sm text-sky-700">{subtitle}</p>
    </div>
  );
}

export function StepCard({ step, text }: { step: number; text: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
          {step}
        </span>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
    </div>
  );
}
