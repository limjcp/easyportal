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
import { ThemePreviewPage } from "./prototype/ThemePreviewPage";
import { useAuth } from "./auth/AuthProvider";
import { getPersistedPortalView, setPersistedPortalView } from "./auth/persistedView";
import { setPersistedAdminRoute } from "./auth/persistedAdminRoute";
import { setActiveBuildingId, setActiveCompanyId, getActiveBuildingId } from "./data/supabase/buildingContext";
import { companyRepository } from "./company/data/companyRepository";
import { formatBuildingOptionLabel } from "./admin/navigation";
import { scrollPageToTop } from "./utils/scroll";
import { QboConnectedPage } from "./auth/QboConnectedPage";
import { ToastProvider } from "./shared/Toast";
import { CookieConsentProvider } from "./shared/CookieConsentProvider";
import { portalRoleToView, resolvePortalForUser } from "./auth/portalNavigation";
import { useAccessibleBuildings } from "./shared/queries/companyQueries";
import { removeBuildingQueries } from "./shared/queryInvalidation";

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
    const persisted = getPersistedPortalView();
    if (persisted) return persisted;
  }
  return "marketing";
};

export default function App() {
  const auth = useAuth();
  const { data: cachedBuildings = [] } = useAccessibleBuildings();
  const [view, setView] = useState<AppView>(getInitialView);
  const [publicPathname, setPublicPathname] = useState<string>(
    typeof window === "undefined" ? "/" : window.location.pathname
  );
  const [activeBuilding, setActiveBuilding] = useState<CompanyBuilding | null>(null);
  const [adminBuildings, setAdminBuildings] = useState<CompanyBuilding[]>([]);
  const [adminActiveBuildingId, setAdminActiveBuildingId] = useState<string | null>(() => getActiveBuildingId());
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onPopState = () => {
      setPublicPathname(window.location.pathname);
      setView(getInitialView());
      scrollPageToTop();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (auth.initializing || !auth.session || !auth.activePortal) return;
    if (view === "marketing" || view === "login") return;
    setView(
      auth.activePortal === "company"
        ? "company"
        : auth.activePortal === "building"
          ? "admin"
          : auth.activePortal === "vendor"
            ? "vendor"
            : "resident"
    );
  }, [auth.initializing, auth.session, auth.activePortal, view]);

  useEffect(() => {
    if (auth.initializing || !auth.session) return;
    if (view === "company" || view === "admin" || view === "resident" || view === "vendor") {
      setPersistedPortalView(view);
    }
  }, [view, auth.initializing, auth.session]);

  useEffect(() => {
    if (auth.initializing || view !== "admin" || !auth.session) return;
    if (auth.portalAccess?.isSuperAdmin) return;
    if (auth.portalAccess?.portals.includes("building")) return;
    auth.setActivePortal("resident");
    setView("resident");
  }, [auth.initializing, auth.session, auth.portalAccess?.portals, auth.portalAccess?.isSuperAdmin, view, auth.setActivePortal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const portalViews: AppView[] = ["resident", "admin", "company", "vendor"];
    const isAuthenticatedPortal = Boolean(auth.session) && portalViews.includes(view);
    document.body.dataset.recaptchaContext = isAuthenticatedPortal ? "authenticated" : "public";
    return () => {
      delete document.body.dataset.recaptchaContext;
    };
  }, [auth.session, view]);

  const handleSwitchToAdmin = async () => {
    if (!auth.portalAccess?.isSuperAdmin && !auth.portalAccess?.portals.includes("building")) {
      window.alert("You do not have access to the Building Admin portal.");
      return;
    }
    const buildingId = getActiveBuildingId() ?? auth.portalAccess?.buildingIds[0] ?? null;
    if (buildingId) {
      setActiveBuildingId(buildingId);
      setAdminActiveBuildingId(buildingId);
    }

    const access = auth.portalAccess;
    if (access?.portals.includes("company") && access.companyId) {
      auth.setActivePortal("company");
      setPersistedPortalView("company");
      setView("company");
      try {
        const buildings = await companyRepository.getBuildings();
        const building =
          (buildingId ? buildings.find((b) => b.id === buildingId) : null) ?? buildings[0] ?? null;
        if (building) {
          await companyRepository.assertBuildingAccess(building.id);
          setActiveBuilding(building);
          setActiveBuildingId(building.id);
        } else {
          setActiveBuilding(null);
          setActiveBuildingId(null);
        }
      } catch {
        setActiveBuilding(null);
        setActiveBuildingId(null);
      }
      return;
    }

    auth.setActivePortal("building");
    setView("admin");
  };

  useEffect(() => {
    if (view !== "admin" || !auth.session) return;
    const buildings = cachedBuildings;
    setAdminBuildings(buildings);
    const activeId = getActiveBuildingId();
    const allowed = buildings.some((b) => b.id === activeId);
    if (!activeId || !allowed) {
      const nextId = buildings[0]?.id ?? null;
      setActiveBuildingId(nextId);
      setAdminActiveBuildingId(nextId);
    } else {
      setAdminActiveBuildingId(activeId);
    }
  }, [view, auth.session, cachedBuildings]);

  const activeAdminBuilding =
    adminBuildings.find((b) => b.id === adminActiveBuildingId) ?? adminBuildings[0] ?? null;

  const handleSwitchAdminBuilding = async (building: CompanyBuilding) => {
    try {
      await companyRepository.assertBuildingAccess(building.id);
    } catch {
      window.alert("You do not have access to this building.");
      return;
    }
    const previousId = getActiveBuildingId();
    if (previousId && previousId !== building.id) {
      removeBuildingQueries(previousId);
    }
    setActiveBuildingId(building.id);
    setAdminActiveBuildingId(building.id);
  };

  const handleOpenResidentPortal = () => {
    const buildingId = activeBuilding?.id ?? adminActiveBuildingId ?? getActiveBuildingId();
    if (buildingId) {
      setActiveBuildingId(buildingId);
      setAdminActiveBuildingId(buildingId);
    }
    auth.setActivePortal("resident");
    setView("resident");
  };

  const navigatePublic = (nextPath: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", nextPath);
      scrollPageToTop();
    }
    setPublicPathname(nextPath);
    setView(nextPath === "/login" ? "login" : "marketing");
  };

  const handleLogin = (portal: LoginPortalRole) => {
    auth.setActivePortal(portal);
    setActiveBuilding(null);
    const nextView = portalRoleToView(portal);
    setPersistedPortalView(nextView);
    setView(nextView);
  };

  const handleGoToWebsite = (path = "/") => {
    navigatePublic(path);
  };

  const handleGoToPortal = () => {
    if (!auth.session) {
      navigatePublic("/login");
      return;
    }
    const portal = resolvePortalForUser({
      activePortal: auth.activePortal,
      portalAccess: auth.portalAccess,
      preferCompanyPortal: true,
    });
    if (!portal) {
      navigatePublic("/login");
      return;
    }
    if (portal === "company") {
      setActiveBuilding(null);
    }
    auth.setActivePortal(portal);
    const nextView = portalRoleToView(portal);
    setPersistedPortalView(nextView);
    setView(nextView);
  };

  useEffect(() => {
    if (auth.initializing || view !== "login") return;
    if (!auth.session) return;
    handleGoToPortal();
  }, [auth.initializing, auth.session, view, auth.activePortal, auth.portalAccess]);

  const handleLogout = async () => {
    setActiveBuilding(null);
    setActiveBuildingId(null);
    setActiveCompanyId(null);
    setIsChatbotOpen(false);
    setPersistedPortalView(null);
    setPersistedAdminRoute(null);
    await auth.signOut();
    navigatePublic("/login");
  };

  const handleOpenBuilding = async (building: CompanyBuilding | null) => {
    if (building) {
      try {
        await companyRepository.assertBuildingAccess(building.id);
      } catch {
        window.alert("You do not have access to this building.");
        return;
      }
      setActiveBuilding(building);
      setActiveBuildingId(building.id);
      return;
    }
    setActiveBuilding(null);
    setActiveBuildingId(null);
  };

  const portalSwitcher = auth.portalAccess?.isSuperAdmin ? (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2 rounded bg-white p-2 shadow-lg">
      {(["company", "admin", "resident", "vendor"] as const).map((portal) => (
        <button
          key={portal}
          type="button"
          className="rounded bg-[#3476ef] px-3 py-1 text-xs text-white"
          onClick={async () => {
            const role = portal === "admin" ? "building" : portal;
            if ((portal === "admin" || portal === "resident") && !getActiveBuildingId()) {
              const buildings = await companyRepository.getBuildings();
              if (buildings[0]) setActiveBuildingId(buildings[0].id);
            }
            auth.setActivePortal(role);
            setView(portal === "admin" ? "admin" : portal);
          }}
        >
          {portal}
        </button>
      ))}
    </div>
  ) : null;

  if (typeof window !== "undefined" && window.location.pathname === "/qbo-connected") {
    return (
      <ToastProvider>
        <CookieConsentProvider>
          <QboConnectedPage />
        </CookieConsentProvider>
      </ToastProvider>
    );
  }

  if (auth.initializing && view !== "marketing") {
    return (
      <ToastProvider>
        <CookieConsentProvider>
          <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading…</div>
        </CookieConsentProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
    <CookieConsentProvider>
    <div className="min-h-screen bg-background text-foreground">
      {view === "marketing" && (
        <MarketingPortal
          pathname={publicPathname}
          onNavigate={navigatePublic}
          onOpenLogin={() => navigatePublic("/login")}
          isLoggedIn={Boolean(auth.session)}
          onGoToPortal={handleGoToPortal}
        />
      )}
      {view === "login" && (
        <LoginPage
          initialMode={
            typeof window !== "undefined" && new URLSearchParams(window.location.search).get("signup") === "1"
              ? "signup"
              : "signin"
          }
          onLogin={handleLogin}
          onOpenMarketing={(path) => navigatePublic(path ?? "/")}
        />
      )}
      {view === "resident" && (
        <ResidentPortal
          onSwitchToAdmin={handleSwitchToAdmin}
          onLogout={handleLogout}
          onGoToWebsite={handleGoToWebsite}
        />
      )}
      {view === "company" && (
        <CompanyPortal
          activeBuilding={activeBuilding}
          onOpenBuilding={handleOpenBuilding}
          onCloseBuilding={() => handleOpenBuilding(null)}
          onOpenResidentPortal={handleOpenResidentPortal}
          onLogout={handleLogout}
          onGoToWebsite={handleGoToWebsite}
        />
      )}
      {view === "admin" && (
        <BuildingAdmin
          key={activeAdminBuilding?.id ?? adminActiveBuildingId ?? "none"}
          onSwitchToResident={() => {
            if (activeAdminBuilding) {
              setActiveBuildingId(activeAdminBuilding.id);
              setAdminActiveBuildingId(activeAdminBuilding.id);
            }
            auth.setActivePortal("resident");
            setView("resident");
          }}
          onLogout={handleLogout}
          onGoToWebsite={handleGoToWebsite}
          buildingLabel={
            activeAdminBuilding ? formatBuildingOptionLabel(activeAdminBuilding) : undefined
          }
          buildings={adminBuildings.length > 1 ? adminBuildings : undefined}
          activeBuildingId={activeAdminBuilding?.id ?? adminActiveBuildingId ?? undefined}
          onSwitchBuilding={adminBuildings.length > 1 ? handleSwitchAdminBuilding : undefined}
        />
      )}
      {view === "vendor" && <VendorPortal onLogout={handleLogout} />}
      {view === "prototype" && <ThemePreviewPage onBack={() => setView("login")} />}
      {portalSwitcher}
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
    </CookieConsentProvider>
    </ToastProvider>
  );
}
