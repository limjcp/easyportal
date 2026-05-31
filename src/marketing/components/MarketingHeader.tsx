import { MvpLogo } from "../../shared/MvpLogo";
import { MARKETING_HEADER_LINKS, MARKETING_PATHS, type MarketingPage } from "../navigation";
import { REQUEST_PROPOSAL_URL, SITE_BANNER } from "../data/siteContent";

type MarketingHeaderProps = {
  currentPage: MarketingPage;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
};

export function MarketingHeader({ currentPage, onNavigate, onOpenLogin }: MarketingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {/* <button
        type="button"
        className="flex w-full items-center justify-center bg-[#1f2937] px-4 py-2 text-center text-xs font-semibold text-white hover:bg-[#111827]"
        onClick={() => onNavigate(SITE_BANNER.href)}
      >
        {SITE_BANNER.text}
      </button> */}
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button type="button" className="flex items-center gap-3" onClick={() => onNavigate("/")}>
          <MvpLogo />
        </button>
        <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wide text-slate-700 sm:gap-6">
          {MARKETING_HEADER_LINKS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(MARKETING_PATHS[item.page])}
              className={
                currentPage === item.page
                  ? "rounded-full bg-[#ecf2ff] px-3 py-1 text-[#1f4db8]"
                  : "rounded-full px-3 py-1 hover:bg-slate-100 hover:text-[#1f4db8]"
              }
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate(REQUEST_PROPOSAL_URL)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Request a Proposal
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-full bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d68cf]"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}

