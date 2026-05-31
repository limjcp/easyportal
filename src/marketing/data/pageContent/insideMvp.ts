import type { MarketingPageContent } from "./types";

export const insideMvpPageContent: MarketingPageContent = {
  pageTitle: "Inside MVP",
  pageIntro:
    "We are a licensed condominium management team focused on long-term community stability through strong governance, clean operations, and practical leadership support.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Who We Are",
      title: "A management company built around trust, execution, and accountability.",
      subtitle:
        "We partner with condominium boards to improve decision quality, financial confidence, and day-to-day resident experience.",
      imageUrl:
        "https://img1.wsimg.com/isteam/getty/2157709105/:/cr=t:0%25,l:18.75%25,w:62.5%25,h:100%25/rs=w:365,h:365,cg:true",
      imageAlt: "MVP team collaboration",
    },
    {
      kind: "section",
      title: "Our approach",
      paragraphs: [
        "At MVP, people come first. We hire for integrity, train for competence, and support boards with consistent, practical advice.",
        "We focus on transparent communication, reliable follow-through, and systems that keep communities running smoothly even as board members rotate over time.",
      ],
    },
    {
      kind: "feature-grid",
      title: "Core service pillars",
      subtitle: "Everything your board needs to lead confidently.",
      items: [
        {
          title: "Full-service property management",
          description:
            "Owner communication, maintenance coordination, contract oversight, compliance tracking, and emergency response.",
        },
        {
          title: "Vendor procurement and oversight",
          description:
            "Access to qualified contractors, multi-quote support, and project supervision aligned to board priorities.",
        },
        {
          title: "Budgeting and monthly financials",
          description:
            "Accurate monthly reporting, reserve planning support, and reliable bookkeeping with accountability.",
        },
        {
          title: "Advocacy and liaison support",
          description:
            "Coordination with legal counsel, engineers, and auditors to protect your corporation's interests.",
        },
      ],
    },
    {
      kind: "cta-band",
      title: "Want to see how this model applies to your building?",
      text: "Schedule a consultation and we will walk through your current pain points and transition options.",
      action: { label: "Talk to MVP", href: "/free-consultation", variant: "primary" },
    },
  ],
};

