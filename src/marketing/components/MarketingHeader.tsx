import { useEffect, useRef, useState } from "react";
import { MvpLogo } from "../../shared/MvpLogo";
import {
  MARKETING_NAV_GROUPS,
  MARKETING_PATHS,
  MARKETING_TOP_LEVEL_LINKS,
  type MarketingPage,
} from "../navigation";
import { REQUEST_PROPOSAL_URL } from "../data/siteContent";
import { useMarketingHeaderHeight } from "../hooks/useMarketingHeaderHeight";
import { pe } from "../typography";
import { MenuIcon } from "./icons";
import { MarketingNavDropdown } from "./MarketingNavDropdown";
import { cn } from "../../utils/cn";

type MarketingHeaderProps = {
  currentPage: MarketingPage;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
  isLoggedIn?: boolean;
  onGoToPortal?: () => void;
};

export function MarketingHeader({
  currentPage,
  onNavigate,
  onOpenLogin,
  isLoggedIn = false,
  onGoToPortal,
}: MarketingHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useMarketingHeaderHeight(headerRef, isMenuOpen);

  useEffect(() => {
    setIsMenuOpen(false);
    setExpandedGroup(null);
  }, [currentPage]);

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setExpandedGroup(null);
  };

  const navLinkClass = `${pe.eyebrowSm} text-muted-foreground hover:text-foreground transition-colors duration-300`;

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <nav className="flex min-w-0 items-center justify-between gap-2 px-6 py-4 md:px-12 md:py-5 lg:px-20">
        <button type="button" className="flex min-w-0 shrink items-center" onClick={() => onNavigate("/")}>
          <MvpLogo className="h-[clamp(2.75rem,6vw,4.5rem)]" />
        </button>

        <div className="hidden xl:flex min-w-0 items-center gap-8 2xl:gap-10">
          {MARKETING_TOP_LEVEL_LINKS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(MARKETING_PATHS[item.page])}
              className={cn(navLinkClass, currentPage === item.page && "text-foreground")}
            >
              {item.label}
            </button>
          ))}
          {MARKETING_NAV_GROUPS.map((group) => (
            <MarketingNavDropdown
              key={group.label}
              group={group}
              currentPage={currentPage}
              onNavigate={onNavigate}
              variant="desktop"
            />
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(REQUEST_PROPOSAL_URL)}
            className={`${pe.eyebrowSm} text-muted-foreground hover:text-foreground transition-colors duration-300`}
          >
            Request a Proposal
          </button>
          <button
            type="button"
            onClick={isLoggedIn ? onGoToPortal : onOpenLogin}
            className={`${pe.eyebrowSm} px-4 py-2 border border-border text-foreground hover:border-foreground/40 transition-colors duration-300`}
          >
            {isLoggedIn ? "Go to Portal" : "Sign In"}
          </button>
        </div>

        <button
          type="button"
          className="xl:hidden shrink-0 text-foreground"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <MenuIcon className={pe.iconMd} />
        </button>
      </nav>

      <div
        className={cn(
          "xl:hidden overflow-hidden transition-all duration-500 ease-in-out bg-background border-t border-border",
          isMenuOpen ? "max-h-[85vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col px-6 py-6">
          {MARKETING_TOP_LEVEL_LINKS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                onNavigate(MARKETING_PATHS[item.page]);
                closeMobileMenu();
              }}
              className={cn(
                `${pe.mobileNav} py-4 text-left transition-colors duration-300 border-b border-border/60`,
                currentPage === item.page ? "text-foreground" : "text-foreground/80 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}

          {MARKETING_NAV_GROUPS.map((group) => (
            <MarketingNavDropdown
              key={group.label}
              group={group}
              currentPage={currentPage}
              onNavigate={onNavigate}
              variant="mobile"
              isExpanded={expandedGroup === group.label}
              onToggle={() => setExpandedGroup((current) => (current === group.label ? null : group.label))}
              onItemClick={closeMobileMenu}
            />
          ))}

          <button
            type="button"
            onClick={() => {
              onNavigate(REQUEST_PROPOSAL_URL);
              closeMobileMenu();
            }}
            className={`${pe.mobileNav} py-4 text-left text-foreground/80 hover:text-foreground transition-colors duration-300 border-t border-border/60 mt-2`}
          >
            Request a Proposal
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLoggedIn) {
                onGoToPortal?.();
              } else {
                onOpenLogin();
              }
              closeMobileMenu();
            }}
            className={`${pe.mobileNav} py-4 text-left text-foreground/80 hover:text-foreground transition-colors duration-300`}
          >
            {isLoggedIn ? "Go to Portal" : "Sign In"}
          </button>
        </div>
      </div>
    </header>
  );
}
