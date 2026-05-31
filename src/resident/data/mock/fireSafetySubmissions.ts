import type { FireSafetySubmission } from "../types";

const placeholderPhoto =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#e2e8f0"/>
      <text x="60" y="58" text-anchor="middle" fill="#64748b" font-size="11" font-family="sans-serif">Smoke</text>
      <text x="60" y="72" text-anchor="middle" fill="#64748b" font-size="11" font-family="sans-serif">Detector</text>
    </svg>`
  );

export const seedFireSafetySubmissions: FireSafetySubmission[] = [
  {
    id: "1",
    unit: "102",
    uploadedAt: "2025-04-15",
    photoDataUrl: placeholderPhoto,
    notes: "Annual verification — date stamp visible on underside",
  },
];
