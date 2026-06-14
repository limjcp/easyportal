export type HomeTopicLink = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type HomeMainTopic = {
  id: string;
  groupLabel: string;
  title: string;
  description: string;
  links: HomeTopicLink[];
};

export const HOME_CAROUSEL_BACKGROUND = {
  imageUrl: "https://img1.wsimg.com/isteam/getty/2186781582/:/rs=h:1000,cg:true,m",
  imageAlt: "Condo community lifestyle",
} as const;

export const HOME_MAIN_TOPICS: HomeMainTopic[] = [
  {
    id: "welcome",
    groupLabel: "Welcome",
    title: "Build a stronger, centralized, more connected condo community.",
    description:
      "From board governance and bookkeeping to vendor coordination and resident communication — trusted management and one easy portal to use.",
    links: [
      { label: "Request a Proposal", href: "/free-consultation", variant: "primary" },
      { label: "Sign In to Portal", href: "/login", variant: "secondary" },
    ],
  },
  {
    id: "about",
    groupLabel: "About",
    title: "Who we are and how we serve your community",
    description:
      "Licensed condominium management with a board-first approach, plus stories and insights from the communities we support.",
    links: [
      { label: "Inside MVP", href: "/inside-mvp", variant: "primary" },
      { label: "The Common Element", href: "/the-common-element", variant: "secondary" },
    ],
  },
  {
    id: "services",
    groupLabel: "Services",
    title: "Management, bookkeeping, and vendor support",
    description:
      "Financial clarity, compliance visibility, qualified contractors, and dependable operations — everything your board needs to lead with confidence.",
    links: [
      { label: "Better Bookkeeping", href: "/better-bookkeeping", variant: "primary" },
      { label: "Compliance Dashboard", href: "/compliance-dashboard", variant: "secondary" },
      { label: "Qualified Contractors", href: "/contractors", variant: "secondary" },
      { label: "Vendors", href: "/vendors", variant: "secondary" },
    ],
  },
  {
    id: "resources",
    groupLabel: "Resources",
    title: "Guides and answers for boards and owners",
    description:
      "Practical education, frequently asked questions, and owner resources to help your community stay informed.",
    links: [
      { label: "FAQ", href: "/faq", variant: "primary" },
      { label: "Free eBook", href: "/ebook", variant: "secondary" },
      { label: "Owner and Board Tips", href: "/owner-and-board-tips", variant: "secondary" },
    ],
  },
  {
    id: "contact",
    groupLabel: "Contact",
    title: "Let's talk about your building",
    description:
      "Reach our team for support, questions, or a confidential second opinion on your current management.",
    links: [
      { label: "Contact Us", href: "/contact-us", variant: "primary" },
      { label: "Get a Free Second Opinion", href: "/free-consultation", variant: "secondary" },
    ],
  },
];
