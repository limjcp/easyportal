import type { MarketingPageContent } from "./types";

export const privacyPolicyPageContent: MarketingPageContent = {
  pageTitle: "Privacy Policy",
  pageIntro: "Last updated: January 17, 2026",
  blocks: [
    {
      kind: "section",
      title: "How we handle personal information",
      paragraphs: [
        "This policy describes how MVP Condos collects, uses, stores, and protects information when you use our website and related services.",
        "Our privacy practices are designed to align with applicable Canadian privacy legislation, including PIPEDA and relevant provincial requirements.",
      ],
    },
    {
      kind: "section",
      title: "Data categories we may collect",
      bullets: [
        "Contact details such as name, email, phone, and address",
        "Usage information such as browser, pages visited, and session timing",
        "Cookie preferences and website interaction signals",
      ],
    },
    {
      kind: "section",
      title: "Why we use this information",
      bullets: [
        "To provide and maintain requested services",
        "To communicate operational updates and support responses",
        "To improve service quality and user experience",
        "To fulfill legal and contractual obligations",
      ],
    },
    {
      kind: "section",
      title: "Retention and disclosure",
      paragraphs: [
        "We retain personal information only as long as needed for legitimate business, legal, and service purposes.",
        "Information may be shared with trusted service providers and partners when required to deliver services or satisfy legal obligations.",
      ],
    },
    {
      kind: "cta-band",
      title: "Questions about privacy?",
      text: "Contact our team for clarification about data handling and privacy requests.",
      action: { label: "Contact MVP", href: "/contact-us", variant: "secondary" },
    },
  ],
};

