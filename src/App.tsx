import { useEffect, useState } from "react";
import { LoginPage } from "./auth/LoginPage";
import { BuildingAdmin } from "./admin/BuildingAdmin";
import { ResidentPortal } from "./resident/ResidentPortal";
import { CompanyPortal } from "./company/CompanyPortal";
import { VendorPortal } from "./vendor/VendorPortal";
import { SupportBubble } from "./shared/SupportBubble";
import { MvpCondosChatbot } from "./shared/MvpCondosChatbot";
import { MarketingPortal } from "./marketing/MarketingPortal";
import { isMarketingPath } from "./marketing/navigation";
import type { LoginPortalRole } from "./resident/data/types";
import type { CompanyBuilding } from "./resident/data/types";
import { companyStore } from "./company/data/companyStore";
import { buildVendorSession, findVendorByUsername } from "./auth/mockAuth";
import { ThemePreviewPage } from "./prototype/ThemePreviewPage";

type AppView = "marketing" | "login" | "resident" | "admin" | "company" | "vendor" | "prototype";

const getInitialView = (): AppView => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("previewTheme") === "1") {
      return "prototype";
    }
    if (window.location.pathname === "/login" || params.get("view") === "login") {
      return "login";
    }
    if (isMarketingPath(window.location.pathname)) {
      return "marketing";
    }
  }
  return "marketing";
};

export default function App() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [publicPathname, setPublicPathname] = useState<string>(
    typeof window === "undefined" ? "/" : window.location.pathname
  );
  const [activeBuilding, setActiveBuilding] = useState<CompanyBuilding | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onPopState = () => {
      setPublicPathname(window.location.pathname);
      setView(getInitialView());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigatePublic = (nextPath: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", nextPath);
    }
    setPublicPathname(nextPath);
    setView(nextPath === "/login" ? "login" : "marketing");
  };

  const handleLogin = (portal: LoginPortalRole, username: string) => {
    if (portal === "company") {
      companyStore.user.role = username.toLowerCase().includes("owner")
        ? "Company Owner"
        : "Company Administrator";
    }
    setActiveBuilding(null);
    if (portal === "vendor") {
      const vendor = findVendorByUsername(username);
      companyStore.vendorSession = vendor ? buildVendorSession(vendor) : null;
      setView("vendor");
      return;
    }
    companyStore.vendorSession = null;
    setView(
      portal === "company" ? "company" : portal === "building" ? "admin" : "resident"
    );
  };

  const handleLogout = () => {
    setActiveBuilding(null);
    companyStore.vendorSession = null;
    setIsChatbotOpen(false);
    navigatePublic("/login");
  };

  return (
    <div className="min-h-screen bg-[#e7edf3] text-slate-900">
      {view === "marketing" && (
        <MarketingPortal
          pathname={publicPathname}
          onNavigate={navigatePublic}
          onOpenLogin={() => navigatePublic("/login")}
        />
      )}
      {view === "login" && (
        <LoginPage onLogin={handleLogin} onOpenMarketing={(path) => navigatePublic(path ?? "/")} />
      )}
      {view === "resident" && (
        <ResidentPortal
          onSwitchToAdmin={() => {
            setActiveBuilding(null);
            setView("admin");
          }}
          onLogout={handleLogout}
        />
      )}
      {view === "company" && (
        <CompanyPortal
          activeBuilding={activeBuilding}
          onOpenBuilding={setActiveBuilding}
          onCloseBuilding={() => setActiveBuilding(null)}
          onLogout={handleLogout}
        />
      )}
      {view === "admin" && (
        <BuildingAdmin
          onSwitchToResident={() => setView("resident")}
          onLogout={handleLogout}
        />
      )}
      {view === "vendor" && <VendorPortal onLogout={handleLogout} />}
      {view === "prototype" && <ThemePreviewPage onBack={() => setView("login")} />}
      {view !== "login" && view !== "marketing" && view !== "prototype" && (
        <>
          <MvpCondosChatbot open={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
          <SupportBubble
            open={isChatbotOpen}
            onToggle={() => setIsChatbotOpen((isOpen) => !isOpen)}
          />
        </>
      )}
    </div>
  );
}
