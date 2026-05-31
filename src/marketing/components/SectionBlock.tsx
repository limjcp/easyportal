import type { ReactNode } from "react";

type SectionBlockProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
};

export function SectionBlock({ title, subtitle, children, className }: SectionBlockProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 ${className ?? ""}`}>
      {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
      {subtitle && <p className="mt-2 max-w-3xl text-sm text-slate-600">{subtitle}</p>}
      {children && <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">{children}</div>}
    </section>
  );
}

