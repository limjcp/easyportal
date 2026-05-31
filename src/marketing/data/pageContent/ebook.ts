import type { MarketingPageContent } from "./types";

export const ebookPageContent: MarketingPageContent = {
  pageTitle: "Free eBook",
  pageIntro: "A practical guide for boards evaluating self-management vs professional condominium management.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Education Resource",
      title: "Can your board manage the community on its own?",
      subtitle:
        "Technically yes, but successful self-governance requires sustained operational capacity, legal awareness, and communication discipline.",
    },
    {
      kind: "section",
      title: "What this guide covers",
      bullets: [
        "The hidden workload behind day-to-day condo operations",
        "Governance and compliance responsibilities boards often underestimate",
        "How professional management improves consistency and risk control",
        "Questions to ask before committing to self-management",
      ],
    },
    {
      kind: "cta-band",
      title: "Download the free PDF",
      text: "Get the guide and use it as a board discussion framework.",
      action: {
        label: "Download eBook",
        href: "https://img1.wsimg.com/blobby/go/0d87cea0-18a0-4a43-b96b-43f0be9d4f86/downloads/efcedb13-54ce-46fd-8e7d-16713b44a342/Free_Perfect_Condo_Management_FINAL_TOC.pdf?ver=1778417855013",
        variant: "primary",
      },
    },
  ],
};

