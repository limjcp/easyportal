import type { MarketingPageContent } from "./types";

export const ownerAndBoardTipsPageContent: MarketingPageContent = {
  pageTitle: "Owner and Board Tips",
  pageIntro: "Practical guidance for directors, owners, and condo leaders who want more confidence in decision-making.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Everything Condo",
      title: "Actionable ideas for healthier condo communities.",
      subtitle:
        "Get management insights, governance reminders, and communication strategies that help boards and owners stay aligned.",
      actions: [{ label: "Subscribe to Updates", href: "/contact-us", variant: "primary" }],
    },
    {
      kind: "feature-grid",
      title: "Topics we cover",
      items: [
        {
          title: "Board governance",
          description: "How to structure decisions, meeting flow, and accountability for better outcomes.",
        },
        {
          title: "Financial literacy for directors",
          description: "How to interpret statements and budgets with greater confidence.",
        },
        {
          title: "Resident communication",
          description: "How to reduce friction with proactive updates and clear service standards.",
        },
        {
          title: "Operational planning",
          description: "How to sequence maintenance, vendor work, and policy changes responsibly.",
        },
      ],
    },
    {
      kind: "section",
      title: "We'd like to talk",
      paragraphs: [
        "Have a question or know a community that needs stronger management support? We are here to help.",
        "If you are exploring career opportunities in condominium management, we are always interested in meeting great people.",
      ],
    },
    {
      kind: "cta-band",
      title: "Need guidance for your board today?",
      text: "Reach out and we will point you to practical next steps.",
      action: { label: "Contact Us", href: "/contact-us", variant: "secondary" },
    },
  ],
};

