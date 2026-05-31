import type { MarketingPageContent } from "./types";

export const betterBookkeepingPageContent: MarketingPageContent = {
  pageTitle: "Better Bookkeeping",
  pageIntro:
    "Your board needs reporting that is accurate, timely, and easy to act on. We build bookkeeping systems that improve confidence and reduce audit friction.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Financial Clarity",
      title: "It is your money. You deserve reporting you can trust.",
      subtitle:
        "MVP combines disciplined bookkeeping workflows with practical board-level explanations so every financial decision has clear context.",
      imageUrl:
        "https://img1.wsimg.com/isteam/getty/2204309551/:/cr=t:0%25,l:23.63%25,w:52.73%25,h:100%25/rs=w:365,h:365,cg:true",
      imageAlt: "Accounting and reporting",
    },
    {
      kind: "feature-grid",
      title: "What better bookkeeping looks like",
      items: [
        {
          title: "Monthly board-ready reporting",
          description:
            "Clear statements with meaningful summaries, not just numbers. Directors understand what changed and why.",
        },
        {
          title: "Reserve and operating fund discipline",
          description:
            "We align budgeting and cash management with long-term maintenance priorities and fiscal resilience.",
        },
        {
          title: "Budget preparation with board collaboration",
          description:
            "Draft budgets are reviewed line by line so final owner communication is accurate and easy to understand.",
        },
        {
          title: "Audit-friendly records",
          description:
            "Structured records and cleaner workflows reduce bottlenecks during annual audits and close cycles.",
        },
      ],
    },
    {
      kind: "cta-band",
      title: "Need a second look at your current reporting quality?",
      text: "We can review your board's current process and identify quick wins for clarity and control.",
      action: { label: "Request Review", href: "/free-consultation", variant: "primary" },
    },
  ],
};

