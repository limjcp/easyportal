export const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80";

/** Clears fixed MarketingHeader; synced at runtime via --marketing-header-height. */
export const MARKETING_HEADER_OFFSET = "pt-[var(--marketing-header-height)]";

export const EDITORIAL_HERO_PAGES = [
  "home",
  "home-1",
  "inside-mvp",
  "contact-us",
  "free-consultation",
  "better-bookkeeping",
  "ebook",
  "the-common-element",
] as const;

export const EDITORIAL_FULL_BLEED_PAGES = [
  "home",
  "home-1",
  "inside-mvp",
  "contact-us",
  "faq",
  "free-consultation",
  "better-bookkeeping",
  "compliance-dashboard",
  "contractors",
  "vendors",
  "owner-and-board-tips",
  "privacy-policy",
  "ebook",
  "the-common-element",
] as const;
