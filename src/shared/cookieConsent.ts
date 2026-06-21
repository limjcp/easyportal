export type CookieCategory = "necessary" | "analytics" | "advertising";

export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
};

const STORAGE_KEY = "mvp-cookie-consent-v1";

function nowIso() {
  return new Date().toISOString();
}

export function getCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (parsed.necessary !== true) return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      advertising: Boolean(parsed.advertising),
      decidedAt: parsed.decidedAt ?? nowIso(),
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: CookieConsentPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...prefs,
      necessary: true,
    })
  );
}

export function hasConsentDecision(): boolean {
  return getCookieConsent() !== null;
}

export function acceptAll(): CookieConsentPreferences {
  const prefs: CookieConsentPreferences = {
    necessary: true,
    analytics: true,
    advertising: true,
    decidedAt: nowIso(),
  };
  saveCookieConsent(prefs);
  return prefs;
}

export function rejectOptional(): CookieConsentPreferences {
  const prefs: CookieConsentPreferences = {
    necessary: true,
    analytics: false,
    advertising: false,
    decidedAt: nowIso(),
  };
  saveCookieConsent(prefs);
  return prefs;
}

export function updatePreferences(
  partial: Pick<CookieConsentPreferences, "analytics" | "advertising">
): CookieConsentPreferences {
  const prefs: CookieConsentPreferences = {
    necessary: true,
    analytics: partial.analytics,
    advertising: partial.advertising,
    decidedAt: nowIso(),
  };
  saveCookieConsent(prefs);
  return prefs;
}
