import { Navigate } from "react-router-dom";
import { ToastProvider } from "./shared/Toast";
import { CookieConsentProvider } from "./shared/CookieConsentProvider";
import { PortalRoutes, legacyPortalRedirect } from "./routing/PortalRoutes";

export default function App() {
  const legacyTarget = legacyPortalRedirect();

  return (
    <ToastProvider>
      <CookieConsentProvider>
        {legacyTarget ? <Navigate to={legacyTarget} replace /> : <PortalRoutes />}
      </CookieConsentProvider>
    </ToastProvider>
  );
}
