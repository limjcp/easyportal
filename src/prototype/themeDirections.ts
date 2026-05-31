export type ThemeColors = {
  pageBg: string;
  shellBg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  success: string;
  warning: string;
};

export type ThemeTypography = {
  heading: string;
  body: string;
  headingWeight: string;
  bodyWeight: string;
  scaleNote: string;
};

export type ThemeComponentStyle = {
  buttons: string;
  cards: string;
  tables: string;
  forms: string;
  sidebarNavbar: string;
  dashboard: string;
};

export type ThemeDirection = {
  id: "trust-blue-pro" | "aurora-glass" | "warm-civic";
  name: string;
  bestUseCase: string;
  vibe: string;
  pros: string[];
  cons: string[];
  colors: ThemeColors;
  typography: ThemeTypography;
  components: ThemeComponentStyle;
};

export const themeDirections: ThemeDirection[] = [
  {
    id: "trust-blue-pro",
    name: "Trust Blue Pro",
    bestUseCase: "Professional B2B property-management workflows with dense operations.",
    vibe: "Confident, clear, reliable, and easy to onboard.",
    pros: [
      "Closest to current visual language, so migration risk is low.",
      "High readability for heavy forms, approvals, and tables.",
      "Works across admin, company, and resident modules without dramatic restyling.",
    ],
    cons: [
      "Less visually unique than trend-forward design systems.",
      "May feel conservative if the product needs a premium marketing feel.",
    ],
    colors: {
      pageBg: "#F8FAFC",
      shellBg: "#E2E8F0",
      surface: "#FFFFFF",
      surfaceAlt: "#F1F5F9",
      border: "#CBD5E1",
      text: "#0F172A",
      mutedText: "#475569",
      primary: "#2563EB",
      primaryHover: "#1D4ED8",
      secondary: "#06B6D4",
      success: "#16A34A",
      warning: "#D97706",
    },
    typography: {
      heading: "Inter, Segoe UI, sans-serif",
      body: "Inter, Segoe UI, sans-serif",
      headingWeight: "600-700",
      bodyWeight: "400-500",
      scaleNote: "Balanced, medium-contrast hierarchy optimized for dashboards.",
    },
    components: {
      buttons: "8px radius, subtle shadow, clear primary/secondary/ghost variants.",
      cards: "White cards with soft borders and lightweight elevation.",
      tables: "Readable row spacing with restrained hover and optional sticky headers.",
      forms: "Strong blue focus ring, clear labels, compact and efficient spacing.",
      sidebarNavbar: "Neutral slate shell with blue active state and concise top utility bar.",
      dashboard: "KPI row + action feed + operational table for day-to-day management.",
    },
  },
  {
    id: "aurora-glass",
    name: "Aurora Glass",
    bestUseCase: "Executive dashboards and premium company-facing experiences.",
    vibe: "Modern, high-tech, bold, and visually differentiated.",
    pros: [
      "Strong brand distinction with a premium SaaS look.",
      "Excellent for dashboard storytelling and status visualization.",
      "Pairs well with advanced analytics modules and growth-facing surfaces.",
    ],
    cons: [
      "Higher implementation effort because dark/glass surfaces need careful consistency.",
      "Accessibility contrast requires stricter validation across states.",
    ],
    colors: {
      pageBg: "#090F1A",
      shellBg: "#0B1220",
      surface: "#111827",
      surfaceAlt: "#1F2937",
      border: "#334155",
      text: "#E5E7EB",
      mutedText: "#9CA3AF",
      primary: "#4F46E5",
      primaryHover: "#4338CA",
      secondary: "#14B8A6",
      success: "#22C55E",
      warning: "#F59E0B",
    },
    typography: {
      heading: "Plus Jakarta Sans, Inter, sans-serif",
      body: "Inter, Segoe UI, sans-serif",
      headingWeight: "600-700",
      bodyWeight: "400-500",
      scaleNote: "Larger headings with tighter tracking for visual dashboards.",
    },
    components: {
      buttons: "Gradient primary CTA, translucent secondary, glowing focus treatment.",
      cards: "Glass-like elevated panels with blur-inspired layering.",
      tables: "Dark raised rows, vivid status chips, stronger active-row emphasis.",
      forms: "Dark inputs with high-visibility focus and helper text hierarchy.",
      sidebarNavbar: "Dark rail with icon-first nav and luminous active accents.",
      dashboard: "Hero metric strip + trend tiles + timeline blocks for executive scanning.",
    },
  },
  {
    id: "warm-civic",
    name: "Warm Civic",
    bestUseCase: "Resident-first, communication-heavy community and service workflows.",
    vibe: "Approachable, human, calm, and inclusive.",
    pros: [
      "Friendly tone that lowers friction for non-technical users.",
      "Great fit for resident announcements, requests, and community modules.",
      "Supports long-form content and guidance-oriented interfaces.",
    ],
    cons: [
      "Less enterprise-corporate aesthetics for board/executive audiences.",
      "Needs careful brand alignment if blue/purple identity is mandatory.",
    ],
    colors: {
      pageBg: "#FFFBF5",
      shellBg: "#F3E8D4",
      surface: "#FFFDF8",
      surfaceAlt: "#F5F0E7",
      border: "#D6D3D1",
      text: "#334155",
      mutedText: "#57534E",
      primary: "#0F766E",
      primaryHover: "#115E59",
      secondary: "#C2410C",
      success: "#16A34A",
      warning: "#B45309",
    },
    typography: {
      heading: "Source Sans 3, Segoe UI, sans-serif",
      body: "Source Sans 3, Segoe UI, sans-serif",
      headingWeight: "600-700",
      bodyWeight: "400-500",
      scaleNote: "Slightly roomier spacing for resident-readable content blocks.",
    },
    components: {
      buttons: "10-12px radius with softer contrast and friendly spacing.",
      cards: "Paper-like layered cards with gentle depth and warm backgrounds.",
      tables: "Simplified density and wider spacing for readability.",
      forms: "Large touch targets with helper-first input guidance.",
      sidebarNavbar: "Light nav rails with earthy accents and clear active states.",
      dashboard: "Community modules prioritized over purely KPI-heavy composition.",
    },
  },
];

export const defaultDirectionId: ThemeDirection["id"] = "trust-blue-pro";
