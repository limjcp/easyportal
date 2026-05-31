import type { MarketingPageContent } from "./types";

export const contactUsPageContent: MarketingPageContent = {
  pageTitle: "Contact Us",
  pageIntro: "Tell us about your community and what support you need. We respond quickly and keep conversations confidential.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Start the conversation",
      title: "Let us know how we can help your board operate at its best.",
      subtitle:
        "Whether you are evaluating management options, handling recurring service issues, or planning a transition, our team can help you map the next step.",
      actions: [{ label: "Book Free Consultation", href: "/free-consultation", variant: "primary" }],
    },
    {
      kind: "feature-grid",
      title: "How we support your request",
      items: [
        {
          title: "Confidential intake",
          description:
            "Share your current context, board priorities, and concerns. We keep all outreach private and professional.",
        },
        {
          title: "Practical recommendations",
          description: "You receive clear options, realistic sequencing, and next-step guidance tailored to your building.",
        },
        {
          title: "Fast follow-up",
          description: "Our team responds quickly so your board can move from uncertainty to action.",
        },
        {
          title: "Emergency escalation",
          description:
            "After-hours emergency support is available through office lines with clear triage for urgent incidents.",
        },
      ],
    },
    {
      kind: "section",
      title: "After-hours emergency guidance",
      paragraphs: [
        "Emergency contact coverage is available from 6pm to 9am. Call any office number and press 1.",
        "If first responders are required, call 911 first. Please keep emergency lines open for urgent incidents only.",
      ],
    },
  ],
};

