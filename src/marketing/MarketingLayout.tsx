import type { ReactNode } from "react";
import { MarketingFooter } from "./components/MarketingFooter";
import { MarketingHeader } from "./components/MarketingHeader";
import type { MarketingPage } from "./navigation";
import { EDITORIAL_FULL_BLEED_PAGES, MARKETING_HEADER_OFFSET } from "./constants";
import { cn } from "../utils/cn";

type MarketingLayoutProps = {
  currentPage: MarketingPage;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
  isLoggedIn?: boolean;
  onGoToPortal?: () => void;
  children: ReactNode;
};

const FULL_BLEED_PAGES = new Set<string>(EDITORIAL_FULL_BLEED_PAGES);

export function MarketingLayout({
  currentPage,
  onNavigate,
  onOpenLogin,
  isLoggedIn = false,
  onGoToPortal,
  children,
}: MarketingLayoutProps) {
  const isFullBleed = FULL_BLEED_PAGES.has(currentPage);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <MarketingHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        onOpenLogin={onOpenLogin}
        isLoggedIn={isLoggedIn}
        onGoToPortal={onGoToPortal}
      />
      <main
        className={cn(
          "w-full",
          MARKETING_HEADER_OFFSET,
          !isFullBleed && "mx-auto max-w-[1180px] px-6 py-28 md:px-12 lg:px-20 md:py-36"
        )}
      >
        {children}
      </main>
      <MarketingFooter onNavigate={onNavigate} />
    </div>
  );
}
