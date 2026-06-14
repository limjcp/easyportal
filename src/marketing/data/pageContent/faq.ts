import type { MarketingPageContent } from "./types";

export const faqPageContent: MarketingPageContent = {
  pageTitle: "Frequently Asked Questions",
  pageIntro:
    "Answers to the most common questions boards ask before selecting a **management partner**.",
  blocks: [
    {
      kind: "faq",
      title: "Real questions from condominium boards",
      items: [
        {
          question: "Do you include digital systems such as owner portals and payment workflows?",
          answer:
            "Yes. We prioritize **efficient, modern workflows** that reduce manual admin burden while improving owner communication and transparency.",
        },
        {
          question: "How often do boards receive financial reporting?",
          answer:
            "Boards receive **monthly reporting** with clear summaries and supporting detail so directors can make informed decisions quickly.",
        },
        {
          question: "How do you handle occasional NSFs and collections?",
          answer:
            "Our team follows **structured, owner-respectful collection workflows** designed to resolve issues quickly while protecting corporation finances.",
        },
        {
          question: "Can you support hybrid or virtual AGM logistics?",
          answer:
            "Yes. We support **in-person, virtual, and hybrid** meeting formats and help ensure planning is smooth and compliant.",
        },
        {
          question: "Do you support management transitions from another company?",
          answer:
            "Absolutely. We run **transition plans** focused on continuity of records, communication, and vendor coordination.",
        },
      ],
    },
    {
      kind: "cta-band",
      title: "Have a specific question about your corporation?",
      text: "Reach out directly and we will provide a **clear answer tailored to your building**.",
      action: { label: "Contact Us", href: "/contact-us", variant: "secondary" },
    },
  ],
};
