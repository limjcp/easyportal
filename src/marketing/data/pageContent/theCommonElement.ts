import type { MarketingPageContent } from "./types";

export const theCommonElementPageContent: MarketingPageContent = {
  pageTitle: "The Common Element",
  pageIntro: "Conversations, stories, and insights from people shaping better condominium communities.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Video Podcast",
      title: "See who is talking about MVP.",
      subtitle:
        "Explore interviews and community stories that highlight governance lessons, leadership decisions, and real-world condo operations.",
    },
    {
      kind: "section",
      title: "What to expect",
      bullets: [
        "Board and owner perspectives",
        "Operations and governance conversations",
        "Practical stories from active condominium communities",
      ],
    },
    {
      kind: "cta-band",
      title: "Want more condo insights?",
      text: "Browse owner and board resources for practical guidance.",
      action: { label: "Owner and Board Tips", href: "/owner-and-board-tips", variant: "secondary" },
    },
  ],
};

