import type { MarketingPageContent } from "./types";

export const vendorsPageContent: MarketingPageContent = {
  pageTitle: "Vendors",
  pageIntro: "Interested in working with MVP-managed communities? Apply to join our contractor network.",
  blocks: [
    {
      kind: "hero",
      eyebrow: "Vendor List Application",
      title: "Join a network built on quality, responsiveness, and professionalism.",
      subtitle:
        "We review vendor submissions based on service reliability, communication quality, and alignment with condominium standards.",
    },
    {
      kind: "section",
      title: "What to include in your submission",
      bullets: [
        "Company details and service specialties",
        "Coverage regions across Ontario",
        "Insurance certificate and licensing details",
        "Primary contact information for scheduling and follow-up",
      ],
    },
    {
      kind: "cta-band",
      title: "Ready to be considered?",
      text: "Send your company details and credentials for review.",
      action: { label: "Contact Vendor Team", href: "/contact-us", variant: "secondary" },
    },
  ],
};

