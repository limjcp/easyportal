import type { CookieConsentPreferences } from "./cookieConsent";

let analyticsLoaded = false;

export function initAnalyticsIfAllowed(prefs: CookieConsentPreferences) {
  if (typeof window === "undefined" || analyticsLoaded || !prefs.analytics) {
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!measurementId) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });

  analyticsLoaded = true;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
