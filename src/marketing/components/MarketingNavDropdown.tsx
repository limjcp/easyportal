import { useEffect, useRef, useState } from "react";
import {
  MARKETING_PATHS,
  type MarketingNavGroup,
  type MarketingPage,
} from "../navigation";
import { pe } from "../typography";
import { cn } from "../../utils/cn";

type MarketingNavDropdownProps = {
  group: MarketingNavGroup;
  currentPage: MarketingPage;
  onNavigate: (path: string) => void;
  variant: "desktop" | "mobile";
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
};

function isGroupActive(group: MarketingNavGroup, currentPage: MarketingPage) {
  return group.items.some((item) => item.page === currentPage);
}

function ChevronIcon({ className, expanded }: { className?: string; expanded?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("transition-transform duration-200", expanded && "rotate-180", className)}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MarketingNavDropdown({
  group,
  currentPage,
  onNavigate,
  variant,
  isExpanded = false,
  onToggle,
  onItemClick,
}: MarketingNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = isGroupActive(group, currentPage);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const closeMenu = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setIsOpen(false), 120);
  };

  useEffect(() => () => clearCloseTimer(), []);

  const handleNavigate = (page: MarketingPage) => {
    onNavigate(MARKETING_PATHS[page]);
    onItemClick?.();
    setIsOpen(false);
  };

  if (variant === "mobile") {
    return (
      <div className="border-b border-border/60 last:border-b-0">
        <button
          type="button"
          className={cn(
            `${pe.mobileNav} w-full flex items-center justify-between py-4 text-left transition-colors duration-300`,
            active ? "text-foreground" : "text-foreground/80"
          )}
          aria-expanded={isExpanded}
          aria-controls={`mobile-nav-${group.label}`}
          onClick={onToggle}
        >
          {group.label}
          <ChevronIcon expanded={isExpanded} />
        </button>
        <div
          id={`mobile-nav-${group.label}`}
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-3 pl-4" role="menu">
            {group.items.map((item) => (
              <button
                key={item.page}
                type="button"
                role="menuitem"
                className={cn(
                  `${pe.bodySm} text-left transition-colors duration-300`,
                  currentPage === item.page
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleNavigate(item.page)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          closeMenu();
        }
      }}
    >
      <button
        type="button"
        className={cn(
          `${pe.eyebrowSm} inline-flex items-center gap-1.5 transition-colors duration-300`,
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {group.label}
        <ChevronIcon expanded={isOpen} className="opacity-70" />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute left-0 top-full z-50 min-w-[220px] pt-3 transition-all duration-200",
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        <div className="rounded-md border border-border bg-background py-2 shadow-lg">
          {group.items.map((item) => (
            <button
              key={item.page}
              type="button"
              role="menuitem"
              className={cn(
                `${pe.bodySm} block w-full px-4 py-2.5 text-left transition-colors duration-200`,
                currentPage === item.page
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              onClick={() => handleNavigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
