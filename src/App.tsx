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
    setView(
      auth.activePortal === "company"
        ? "company"
        : auth.activePortal === "building"
          ? "admin"
          : auth.activePortal === "vendor"
            ? "vendor"
            : "resident"
    );
  }, [auth.initializing, auth.session, auth.activePortal]);

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
          setActiveBuilding(building);
          setActiveBuildingId(building.id);
        }
      } catch {
        // Company portal still opens; user can select a building from the list.
      }
      return;
    }

    auth.setActivePortal("building");
    setView("admin");
  };

  useEffect(() => {
    if (view !== "admin" || !auth.session) return;
    let cancelled = false;
    companyRepository
      .getBuildings()
      .then((buildings) => {
        if (cancelled) return;
        setAdminBuildings(buildings);
        const activeId = getActiveBuildingId();
        if (!activeId && buildings[0]) {
          setActiveBuildingId(buildings[0].id);
          setAdminActiveBuildingId(buildings[0].id);
        } else if (activeId) {
          setAdminActiveBuildingId(activeId);
        }
      })
      .catch(() => {
        if (!cancelled) setAdminBuildings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [view, auth.session]);

  const activeAdminBuilding =
    adminBuildings.find((b) => b.id === adminActiveBuildingId) ?? adminBuildings[0] ?? null;

  const handleSwitchAdminBuilding = (building: CompanyBuilding) => {
    setActiveBuildingId(building.id);
    setAdminActiveBuildingId(building.id);
    setAdminBuildings((prev) => {
      const exists = prev.some((b) => b.id === building.id);
      return exists ? prev : [...prev, building];
    });
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
    const nextView =
      portal === "company" ? "company" : portal === "building" ? "admin" : portal === "vendor" ? "vendor" : "resident";
    setPersistedPortalView(nextView);
    setView(nextView);
  };

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

  const handleOpenBuilding = (building: CompanyBuilding | null) => {
    setActiveBuilding(building);
    if (building) setActiveBuildingId(building.id);
    else setActiveBuildingId(null);
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

  if (auth.initializing && view !== "marketing" && view !== "login") {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "marketing" && (
        <MarketingPortal
          pathname={publicPathname}
          onNavigate={navigatePublic}
          onOpenLogin={() => navigatePublic("/login")}
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
        <ResidentPortal onSwitchToAdmin={handleSwitchToAdmin} onLogout={handleLogout} />
      )}
      {view === "company" && (
        <CompanyPortal
          activeBuilding={activeBuilding}
          onOpenBuilding={handleOpenBuilding}
          onCloseBuilding={() => handleOpenBuilding(null)}
          onOpenResidentPortal={handleOpenResidentPortal}
          onLogout={handleLogout}
        />
      )}
      {view === "admin" && (
        <BuildingAdmin
          onSwitchToResident={() => {
            if (activeAdminBuilding) {
              setActiveBuildingId(activeAdminBuilding.id);
              setAdminActiveBuildingId(activeAdminBuilding.id);
            }
            auth.setActivePortal("resident");
            setView("resident");
          }}
          onLogout={handleLogout}
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
  );
}
