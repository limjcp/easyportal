export type MarketingAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type MarketingFeatureCard = {
  title: string;
  description: string;
};

export type MarketingFaqItem = {
  question: string;
  answer: string;
};

export type MarketingTestimonial = {
  quote: string;
  author: string;
  role: string;
  rating?: number;
};

export type MarketingPageBlock =
  | {
      kind: "hero";
      eyebrow?: string;
      title: string;
      subtitle: string;
      actions?: MarketingAction[];
      imageUrl?: string;
      imageAlt?: string;
    }
  | {
      kind: "section";
      title: string;
      subtitle?: string;
      paragraphs?: string[];
      bullets?: string[];
    }
  | {
      kind: "feature-grid";
      title: string;
      subtitle?: string;
      items: MarketingFeatureCard[];
    }
  | {
      kind: "faq";
      title: string;
      subtitle?: string;
      items: MarketingFaqItem[];
    }
  | {
      kind: "testimonial-grid";
      title: string;
      subtitle?: string;
      items: MarketingTestimonial[];
    }
  | {
      kind: "cta-band";
      title: string;
      text: string;
      action: MarketingAction;
    };

export type MarketingPageContent = {
  pageTitle: string;
  pageIntro?: string;
  blocks: MarketingPageBlock[];
};

