import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type AdminMobileCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  fields?: { label: ReactNode; value: ReactNode }[];
  actions?: ReactNode;
  onClick?: () => void;
  highlight?: boolean;
  className?: string;
};

export function AdminMobileCard({
  title,
  subtitle,
  badges,
  fields = [],
  actions,
  onClick,
  highlight,
  className,
}: AdminMobileCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded border border-slate-200 bg-white p-3 text-left shadow-sm transition",
        onClick && "hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100",
        highlight && "border-l-4 border-l-[#3476ef]",
        className
      )}
    >
      {(title || badges) && (
        <div className="mb-2 flex items-start justify-between gap-2">
          {title ? (
            <div className="min-w-0 flex-1 font-medium text-slate-900">{title}</div>
          ) : (
            <span />
          )}
          {badges ? <div className="flex shrink-0 flex-wrap items-center gap-1">{badges}</div> : null}
        </div>
      )}
      {subtitle ? <div className="mb-2 text-xs text-slate-500">{subtitle}</div> : null}
      {fields.length > 0 && (
        <dl className="grid gap-1.5 text-sm">
          {fields.map((field, i) => (
            <div key={i} className="flex gap-2">
              <dt className="w-24 shrink-0 text-xs font-medium text-slate-500">{field.label}</dt>
              <dd className="min-w-0 flex-1 text-slate-700">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions ? <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">{actions}</div> : null}
    </Wrapper>
  );
}
