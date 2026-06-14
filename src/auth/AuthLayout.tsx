import type { ReactNode } from "react";
import { MvpLogo } from "../shared/MvpLogo";
import { FooterCredits } from "../marketing/components/FooterCredits";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function AuthLayout({ children, title, subtitle, onBack }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 font-sans antialiased">
      <header className="shrink-0 px-4 py-4 md:px-8 lg:px-12">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Back to home
          </button>
        )}
      </header>

      <main className="flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:min-h-0">
        <div className="flex flex-col items-center justify-center px-6 py-8 lg:px-16 lg:py-12">
          <MvpLogo className="h-20 md:h-28 lg:h-36 xl:h-40" />
        </div>

        <div className="flex flex-col items-center justify-center px-4 pb-10 lg:px-12 lg:py-16">
          <div className="w-full max-w-md mx-auto rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-4">
        <FooterCredits compact />
      </footer>
    </div>
  );
}

export const authInputClassName =
  "w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0078c8] focus:ring-1 focus:ring-[#0078c8]";

export const authLabelClassName = "block text-xs font-medium uppercase tracking-wide text-slate-500";

export const authPrimaryButtonClassName =
  "w-full rounded bg-[#0078c8] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#006bb3] disabled:cursor-not-allowed disabled:opacity-50";

export const authSecondaryButtonClassName =
  "text-sm text-[#0078c8] hover:underline disabled:opacity-50";
