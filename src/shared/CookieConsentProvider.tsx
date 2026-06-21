import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initAnalyticsIfAllowed } from "./analytics";
import { CookieConsentBanner } from "./CookieConsentBanner";
import {
  acceptAll,
  getCookieConsent,
  hasConsentDecision,
  rejectOptional,
  updatePreferences,
  type CookieConsentPreferences,
} from "./cookieConsent";

type CookieConsentContextValue = {
  preferences: CookieConsentPreferences | null;
  hasDecision: boolean;
  acceptAllCookies: () => void;
  rejectOptionalCookies: () => void;
  savePreferences: (analytics: boolean, advertising: boolean) => void;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(() =>
    typeof window === "undefined" ? null : getCookieConsent()
  );
  const [hasDecision, setHasDecision] = useState(() =>
    typeof window === "undefined" ? false : hasConsentDecision()
  );
  const [showPreferences, setShowPreferences] = useState(false);

  const applyPreferences = useCallback((next: CookieConsentPreferences) => {
    setPreferences(next);
    setHasDecision(true);
    initAnalyticsIfAllowed(next);
  }, []);

  useEffect(() => {
    const existing = getCookieConsent();
    if (existing) {
      applyPreferences(existing);
    }
  }, [applyPreferences]);

  const acceptAllCookies = useCallback(() => {
    applyPreferences(acceptAll());
    setShowPreferences(false);
  }, [applyPreferences]);

  const rejectOptionalCookies = useCallback(() => {
    applyPreferences(rejectOptional());
    setShowPreferences(false);
  }, [applyPreferences]);

  const savePreferences = useCallback(
    (analytics: boolean, advertising: boolean) => {
      applyPreferences(updatePreferences({ analytics, advertising }));
      setShowPreferences(false);
    },
    [applyPreferences]
  );

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      hasDecision,
      acceptAllCookies,
      rejectOptionalCookies,
      savePreferences,
      openPreferences,
    }),
    [
      preferences,
      hasDecision,
      acceptAllCookies,
      rejectOptionalCookies,
      savePreferences,
      openPreferences,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <CookieConsentBanner
        preferences={preferences}
        hasDecision={hasDecision}
        showPreferences={showPreferences}
        onAcceptAll={acceptAllCookies}
        onRejectOptional={rejectOptionalCookies}
        onSavePreferences={savePreferences}
        onOpenPreferences={() => setShowPreferences(true)}
        onClosePreferences={() => setShowPreferences(false)}
      />
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
