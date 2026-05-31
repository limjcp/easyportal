import type { ReactNode } from "react";

type PortalSettingsAlertProps = {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
};

export function PortalSettingsAlert({ title, children, icon }: PortalSettingsAlertProps) {
  return (
    <div className="rounded-sm border border-sky-200 bg-sky-50 px-4 py-4 text-center text-slate-700">
      <h4 className="flex items-center justify-center gap-2 font-semibold text-slate-800">
        {icon}
        {title}
      </h4>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}
