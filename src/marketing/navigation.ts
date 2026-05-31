export type MarketingPage =
  | "home"
  | "inside-mvp"
  | "contact-us"
  | "faq"
  | "better-bookkeeping"
  | "contractors"
  | "privacy-policy"
  | "owner-and-board-tips"
  | "free-consultation"
  | "vendors"
  | "ebook"
  | "the-common-element"
  | "home-1";

export const MARKETING_PATHS: Record<MarketingPage, string> = {
  home: "/",
  "inside-mvp": "/inside-mvp",
  "contact-us": "/contact-us",
  faq: "/faq",
  "better-bookkeeping": "/better-bookkeeping",
  contractors: "/contractors",
  "privacy-policy": "/privacy-policy",
  "owner-and-board-tips": "/owner-and-board-tips",
  "free-consultation": "/free-consultation",
  vendors: "/vendors",
  ebook: "/ebook",
  "the-common-element": "/the-common-element",
  "home-1": "/home-1",
};

const MARKETING_PAGES = Object.keys(MARKETING_PATHS) as MarketingPage[];

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PAGES.some((page) => MARKETING_PATHS[page] === pathname);
}

export function resolveMarketingPage(pathname: string): MarketingPage {
  const found = MARKETING_PAGES.find((page) => MARKETING_PATHS[page] === pathname);
  return found ?? "home";
}

export type MarketingNavItem = {
  label: string;
  page: MarketingPage;
};

export const MARKETING_HEADER_LINKS: MarketingNavItem[] = [
  { label: "Home", page: "home" },
  { label: "Inside MVP", page: "inside-mvp" },
  { label: "Contact Us", page: "contact-us" },
  { label: "FAQ", page: "faq" },
];

export const MARKETING_HOME_FEATURE_LINKS: MarketingNavItem[] = [
  { label: "Better Bookkeeping", page: "better-bookkeeping" },
  { label: "Contractors", page: "contractors" },
  { label: "FAQ", page: "faq" },
  { label: "eBook", page: "ebook" },
  { label: "The Common Element", page: "the-common-element" },
];

