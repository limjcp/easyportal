import type { MarketingPageContent } from "./types";

export const freeConsultationPageContent: MarketingPageContent = {
  pageEyebrow: "We Hear You",
  pageTitle: "Free Condo Second Opinion",
  pageIntro:
    "A **confidential, no-pressure review** for boards evaluating management performance, transition risk, or operational challenges. Answer a few quick questions below. You do not need every detail solved before reaching out — we will help you **frame the problem** and identify your best path forward.",
  blocks: [
    {
      kind: "section",
      title: "What your board should evaluate before hiring a manager",
      bullets: [
        "How **governance responsibilities** are supported and documented",
        "How **monthly reporting** is structured and explained",
        "How **communication expectations** are defined and met",
        "How **transition continuity** is protected if staffing changes occur",
        "How **long-term planning** is integrated into day-to-day operations",
      ],
    },
    {
      kind: "feature-grid",
      title: "When a board may need to reassess management",
      items: [
        {
          title: "Communication delays",
          description: "Repeated response gaps that impact **board visibility** and decision quality.",
        },
        {
          title: "Reporting confusion",
          description: "Financial statements or updates that are **difficult to interpret** and act on.",
        },
        {
          title: "Vendor execution friction",
          description: "Project follow-through that creates **unnecessary risk** or disruption.",
        },
        {
          title: "Compliance uncertainty",
          description: "Lack of clarity around **legal obligations**, records, or process accountability.",
        },
      ],
    },
    {
      kind: "cta-band",
      title: "Let's review your current situation together.",
      text: "Share your context and we will provide **practical recommendations with no pressure**.",
      action: { label: "Contact MVP", href: "/contact-us", variant: "primary" },
    },
  ],
};
