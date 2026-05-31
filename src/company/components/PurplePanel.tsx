import type { ReactNode } from "react";

export function PurplePanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-sm border border-slate-200 ${className}`}>
      <div className="bg-[#7D5DA7] px-3 py-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="bg-white p-3">{children}</div>
    </div>
  );
}
