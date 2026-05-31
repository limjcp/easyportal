import type { ReactNode } from "react";
import { CookieNotice } from "./components/CookieNotice";
import { MarketingFooter } from "./components/MarketingFooter";
import { MarketingHeader } from "./components/MarketingHeader";
import type { MarketingPage } from "./navigation";

type MarketingLayoutProps = {
  currentPage: MarketingPage;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
  children: ReactNode;
};

export function MarketingLayout({ currentPage, onNavigate, onOpenLogin, children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef4ff] via-[#f7f9fc] to-[#f3f6fb] text-slate-900">
      <MarketingHeader currentPage={currentPage} onNavigate={onNavigate} onOpenLogin={onOpenLogin} />
      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      <MarketingFooter onNavigate={onNavigate} />
      <CookieNotice />
    </div>
  );
}

