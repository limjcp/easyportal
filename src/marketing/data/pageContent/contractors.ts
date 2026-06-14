import type { MarketingPageContent } from "./types";

export const contractorsPageContent: MarketingPageContent = {
  pageEyebrow: "Vendor Procurement Network",
  pageTitle: "Qualified Contractors",
  pageIntro:
    "**Vendor quality and execution reliability** shape the resident experience. We help boards source, compare, and manage contractor performance with confidence. Whether you are controlling costs, replacing underperforming vendors, or planning major projects, we help boards **evaluate better options quickly**.",
  blocks: [
    {
      kind: "feature-grid",
      title: "How we improve contractor outcomes",
      items: [
        {
          title: "Broader bid coverage",
          description: "We surface **more qualified options** so your board can compare value, not just price.",
        },
        {
          title: "Contract and scope clarity",
          description:
            "**Clear scopes** reduce rework and surprises, and improve accountability during delivery.",
        },
        {
          title: "Performance visibility",
          description: "Boards get better visibility into **timeline, communication, and workmanship quality**.",
        },
        {
          title: "Owner-aware execution",
          description:
            "We prioritize vendor coordination that **limits disruption** while keeping residents informed.",
        },
      ],
    },
    {
      kind: "cta-band",
      title: "Are you a contractor who wants to work with MVP communities?",
      text: "Apply to be reviewed for our **vendor network**.",
      action: { label: "Vendors Click Here", href: "/vendors", variant: "secondary" },
    },
  ],
};
