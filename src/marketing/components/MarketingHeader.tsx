import { useEffect, useState } from "react";
import { MvpLogo } from "../../shared/MvpLogo";
import { MARKETING_HEADER_LINKS, MARKETING_PATHS, type MarketingPage } from "../navigation";
import { EDITORIAL_HERO_PAGES } from "../constants";
import { REQUEST_PROPOSAL_URL } from "../data/siteContent";
import { pe } from "../typography";
import { MenuIcon } from "./icons";
import { cn } from "../../utils/cn";

const HERO_TOP_PAGES = new Set<string>(EDITORIAL_HERO_PAGES);

type MarketingHeaderProps = {
  currentPage: MarketingPage;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
  solidHeader?: boolean;
};

export function MarketingHeader({ currentPage, onNavigate, onOpenLogin, solidHeader = false }: MarketingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasHeroTop = !solidHeader && HERO_TOP_PAGES.has(currentPage);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPage]);

  const useLightChrome = hasHeroTop && !isScrolled;
  const navLinkClass = cn(
    `${pe.eyebrowSm} transition-colors duration-500 hover:opacity-100`,
    useLightChrome ? "text-background/60 hover:text-background" : "text-muted-foreground hover:text-foreground"
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled || !hasHeroTop ? "bg-background/95 backdrop-blur border-b border-border" : "bg-transparent"
      )}
    >
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <button type="button" className="flex items-center" onClick={() => onNavigate("/")}>
          <MvpLogo className={cn("h-14 md:h-16 lg:h-[4.5rem]", useLightChrome && "drop-shadow-md")} />
        </button>

        <div className="hidden lg:flex items-center gap-10">
          {MARKETING_HEADER_LINKS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(MARKETING_PATHS[item.page])}
              className={cn(
                navLinkClass,
                currentPage === item.page && (useLightChrome ? "text-background" : "text-foreground")
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate(REQUEST_PROPOSAL_URL)}
            className={cn(
              `${pe.eyebrowSm} transition-colors duration-500`,
              useLightChrome
                ? "text-background/70 hover:text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Request a Proposal
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className={cn(
              `${pe.eyebrowSm} px-4 py-2 border transition-colors duration-500`,
              useLightChrome
                ? "border-background/30 text-background hover:border-background/60"
                : "border-border text-foreground hover:border-foreground/40"
            )}
          >
            Sign In
          </button>
        </div>

        <button
          type="button"
          className={cn(
            "md:hidden transition-colors duration-500",
            useLightChrome ? "text-background" : "text-foreground"
          )}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <MenuIcon className={pe.iconMd} />
        </button>
      </nav>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-500 ease-in-out bg-background",
          isMenuOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col px-6 py-10 gap-6">
          {MARKETING_HEADER_LINKS.map((item, index) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(MARKETING_PATHS[item.page])}
              className={`${pe.mobileNav} text-foreground hover:text-muted-foreground transition-colors duration-300 text-left`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onNavigate(REQUEST_PROPOSAL_URL)}
            className={`${pe.mobileNav} text-foreground hover:text-muted-foreground transition-colors duration-300 text-left`}
          >
            Request a Proposal
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className={`${pe.mobileNav} text-foreground hover:text-muted-foreground transition-colors duration-300 text-left`}
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
