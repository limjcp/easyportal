import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-lg rounded-sm bg-white/95 px-8 py-12 text-center shadow-lg">
      <h2 className="text-xl font-medium text-slate-600">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
