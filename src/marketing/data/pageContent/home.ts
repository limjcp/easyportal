import type { MarketingPageContent } from "./types";

export const homePageContent: MarketingPageContent = {
  pageTitle: "A better condominium management experience starts here.",
  pageIntro:
    "MVP Condos combines responsive people, dependable systems, and transparent reporting to help boards and owners operate with confidence.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Modern Condo Management",
      title: "Build a stronger, calmer, more connected condo community.",
      subtitle:
        "From board governance and bookkeeping to vendor coordination and resident communication, MVP Condos gives your community one trusted operating partner.",
      actions: [
        { label: "Request a Proposal", href: "/free-consultation", variant: "primary" },
        { label: "Explore Services", href: "/inside-mvp", variant: "secondary" },
      ],
      imageUrl: "https://img1.wsimg.com/isteam/getty/2186781582/:/rs=h:1000,cg:true,m",
      imageAlt: "Condo community lifestyle",
    },
    {
      kind: "feature-grid",
      title: "Why boards choose MVP",
      subtitle: "A practical, high-accountability approach built for long-term stability.",
      items: [
        {
          title: "Board-first governance support",
          description:
            "Directors get clear recommendations, compliance support, and disciplined follow-through on decisions.",
        },
        {
          title: "Financial reporting you can trust",
          description:
            "Timely monthly statements, reserve-aware planning, and clean bookkeeping that reduces year-end audit stress.",
        },
        {
          title: "Reliable vendor execution",
          description:
            "Access qualified contractors, compare options, and keep projects moving with transparent oversight.",
        },
        {
          title: "Resident communication that works",
          description:
            "Clear updates, predictable service standards, and quick issue routing through modern portal workflows.",
        },
      ],
    },
    {
      kind: "testimonial-grid",
      title: "5-star experiences from communities we support",
      subtitle: "Boards and owners consistently call out responsiveness, clarity, and care.",
      items: [
        {
          quote:
            "Our board meetings are more productive now. We get actionable reports, faster follow-ups, and far less confusion.",
          author: "Maria C.",
          role: "Board President",
          rating: 5,
        },
        {
          quote:
            "The communication quality is excellent. Owners know what is happening and response times are noticeably better.",
          author: "Daniel R.",
          role: "Condo Owner",
          rating: 5,
        },
        {
          quote:
            "From bookkeeping to vendor coordination, everything feels structured and professional. It is a real upgrade.",
          author: "Sophia L.",
          role: "Treasurer",
          rating: 5,
        },
      ],
    },
    {
      kind: "cta-band",
      title: "Ready for a management partner that executes?",
      text: "Book a confidential consultation and get a practical roadmap tailored to your community.",
      action: { label: "Book Free Consultation", href: "/free-consultation", variant: "primary" },
    },
  ],
};

