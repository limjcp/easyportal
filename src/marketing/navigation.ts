export type MarketingPage =
  | "home"
  | "inside-mvp"
  | "contact-us"
  | "faq"
  | "better-bookkeeping"
  | "compliance-dashboard"
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
  "compliance-dashboard": "/compliance-dashboard",
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

export type MarketingNavGroup = {
  label: string;
  items: MarketingNavItem[];
};

export const MARKETING_TOP_LEVEL_LINKS: MarketingNavItem[] = [{ label: "Home", page: "home" }];

export const MARKETING_NAV_GROUPS: MarketingNavGroup[] = [
  {
    label: "About",
    items: [
      { label: "Inside MVP", page: "inside-mvp" },
      { label: "The Common Element", page: "the-common-element" },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Better Bookkeeping", page: "better-bookkeeping" },
      { label: "Compliance Dashboard", page: "compliance-dashboard" },
      { label: "Qualified Contractors", page: "contractors" },
      { label: "Vendors", page: "vendors" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "FAQ", page: "faq" },
      { label: "Free eBook", page: "ebook" },
      { label: "Owner and Board Tips", page: "owner-and-board-tips" },
    ],
  },
  {
    label: "Contact",
    items: [
      { label: "Contact Us", page: "contact-us" },
      { label: "Free Second Opinion", page: "free-consultation" },
    ],
  },
  {
    label: "Legal",
    items: [{ label: "Privacy Policy", page: "privacy-policy" }],
  },
];

/** @deprecated Use MARKETING_TOP_LEVEL_LINKS and MARKETING_NAV_GROUPS instead */
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

