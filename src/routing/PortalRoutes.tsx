import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { LoginPage } from "../auth/LoginPage";
import { ChangePasswordPage } from "../auth/ChangePasswordPage";
import { QboConnectedPage } from "../auth/QboConnectedPage";
import { profileMustChangePassword } from "../auth/supabaseAuth";
import { resolvePortalForUser } from "../auth/portalNavigation";
import { BuildingAdmin } from "../admin/BuildingAdmin";
import { ResidentPortal } from "../resident/ResidentPortal";
import { CompanyPortal } from "../company/CompanyPortal";
import { VendorPortal } from "../vendor/VendorPortal";
import { MarketingPortal } from "../marketing/MarketingPortal";
import { ThemePreviewPage } from "../prototype/ThemePreviewPage";
import { SupportBubble } from "../shared/SupportBubble";
import { MvpCondosChatbot } from "../shared/MvpCondosChatbot";
import type { LoginPortalRole } from "../resident/data/types";
import type { CompanyBuilding } from "../resident/data/types";
import { formatBuildingOptionLabel } from "../admin/navigation";
import { portalDefaultPath } from "./portalPaths";
import { ScrollToTop } from "./ScrollToTop";
import {
  extractAdminSubPath,
  standaloneAdminPrefix,
  companyBuildingAdminPrefix,
  parseStandaloneAdminPath,
} from "./adminRoutePaths";
import { isCompanyPortalPath } from "./companyRoutePaths";
import { setActiveBuildingId, setActiveCompanyId, getActiveBuildingId } from "../data/supabase/buildingContext";
import { companyRepository } from "../company/data/companyRepository";
import { useAccessibleBuildings } from "../shared/queries/companyQueries";
import { removeBuildingQueries } from "../shared/queryInvalidation";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
}

function RequireSession({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.initializing) return <LoadingScreen />;
  if (!auth.session) return <Navigate to="/login" replace />;
  return children;
}

function RequirePasswordChanged({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const mustChange = profileMustChangePassword(auth.profile);
  if (mustChange) return <Navigate to="/change-password" replace />;
  return children;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const mustChange = profileMustChangePassword(auth.profile);
  if (auth.initializing) return <LoadingScreen />;
  if (auth.session && mustChange) return <Navigate to="/change-password" replace />;
  if (auth.session) return <Navigate to={resolvePostLoginPath(auth)} replace />;
  return children;
}

function resolvePostLoginPath(auth: ReturnType<typeof useAuth>): string {
  const portal = resolvePortalForUser({
    activePortal: auth.activePortal,
    portalAccess: auth.portalAccess,
    preferCompanyPortal: true,
  });
  if (!portal) return "/login";
  const buildingId = getActiveBuildingId() ?? auth.portalAccess?.buildingIds[0] ?? null;
  return portalDefaultPath(portal, buildingId);
}

function PortalChrome({ children }: { children: React.ReactNode }) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  return (
    <>
      {children}
      <MvpCondosChatbot open={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      <SupportBubble
        open={isChatbotOpen}
        onToggle={() => setIsChatbotOpen((isOpen) => !isOpen)}
      />
    </>
  );
}

function LoginRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pendingPortal, setPendingPortal] = useState<LoginPortalRole>("resident");

  const handleLogin = (portal: LoginPortalRole) => {
    auth.setActivePortal(portal);
    const buildingId = getActiveBuildingId() ?? auth.portalAccess?.buildingIds[0] ?? null;
    navigate(portalDefaultPath(portal, buildingId));
  };

  const handleRequirePasswordChange = (portal: LoginPortalRole) => {
    setPendingPortal(portal);
    auth.setActivePortal(portal);
    navigate("/change-password");
  };

  return (
    <LoginPage
      initialMode={
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("signup") === "1"
          ? "signup"
          : "signin"
      }
      onLogin={handleLogin}
      onRequirePasswordChange={handleRequirePasswordChange}
      onOpenMarketing={(path) => navigate(path ?? "/")}
    />
  );
}

function ChangePasswordRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const mustChange = profileMustChangePassword(auth.profile);
  const pendingPortal =
    auth.activePortal ?? auth.portalAccess?.defaultPortal ?? ("resident" as LoginPortalRole);

  if (!auth.session) return <Navigate to="/login" replace />;
  if (!mustChange) return <Navigate to={resolvePostLoginPath(auth)} replace />;

  const handleLogout = async () => {
    setActiveBuildingId(null);
    setActiveCompanyId(null);
    await auth.signOut();
    navigate("/login");
  };

  return (
    <ChangePasswordPage
      pendingPortal={pendingPortal}
      onComplete={(portal) => {
        auth.setActivePortal(portal);
        const buildingId = getActiveBuildingId() ?? auth.portalAccess?.buildingIds[0] ?? null;
        navigate(portalDefaultPath(portal, buildingId));
      }}
      onSignOut={() => void handleLogout()}
    />
  );
}

function MarketingRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleGoToPortal = () => {
    if (!auth.session) {
      navigate("/login");
      return;
    }
    if (profileMustChangePassword(auth.profile)) {
      navigate("/change-password");
      return;
    }
    navigate(resolvePostLoginPath(auth));
  };

  return (
    <MarketingPortal
      pathname={pathname}
      onNavigate={(path) => navigate(path)}
      onOpenLogin={() => navigate("/login")}
      isLoggedIn={Boolean(auth.session)}
      onGoToPortal={handleGoToPortal}
    />
  );
}

function CompanyRoutes() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setActiveBuildingId(null);
    setActiveCompanyId(null);
    await auth.signOut();
    navigate("/login");
  };

  const handleOpenResidentPortal = () => {
    const buildingId = getActiveBuildingId();
    if (buildingId) setActiveBuildingId(buildingId);
    auth.setActivePortal("resident");
    navigate("/resident");
  };

  return (
    <PortalChrome>
      <CompanyPortal
        onOpenResidentPortal={handleOpenResidentPortal}
        onLogout={() => void handleLogout()}
        onGoToWebsite={() => navigate("/")}
      />
    </PortalChrome>
  );
}

function StandaloneAdminPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: cachedBuildings = [] } = useAccessibleBuildings();
  const params = useParams();
  const buildingId = params.buildingId ?? null;

  const adminMatch = useMemo(
    () =>
      buildingId
        ? {
            buildingId,
            adminSubPath: extractAdminSubPath(
              location.pathname,
              standaloneAdminPrefix(buildingId)
            ),
          }
        : parseStandaloneAdminPath(location.pathname),
    [buildingId, location.pathname]
  );

  useEffect(() => {
    if (auth.initializing || !auth.session) return;
    if (!auth.portalAccess?.portals.includes("building") && !auth.portalAccess?.isSuperAdmin) {
      auth.setActivePortal("resident");
      navigate("/resident", { replace: true });
    }
  }, [auth.initializing, auth.session, auth.portalAccess, auth.setActivePortal, navigate]);

  const adminBuildings = cachedBuildings;
  const activeAdminBuilding =
    adminBuildings.find((b) => b.id === (adminMatch?.buildingId ?? buildingId)) ??
    adminBuildings[0] ??
    null;

  useEffect(() => {
    if (!buildingId && adminBuildings[0]) {
      navigate(standaloneAdminPrefix(adminBuildings[0].id), { replace: true });
    }
  }, [buildingId, adminBuildings, navigate]);

  useEffect(() => {
    if (activeAdminBuilding) {
      setActiveBuildingId(activeAdminBuilding.id);
    }
  }, [activeAdminBuilding]);

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
    const currentSub = adminMatch?.adminSubPath ?? "";
    const nextPrefix = standaloneAdminPrefix(building.id);
    navigate(currentSub ? `${nextPrefix}/${currentSub}` : nextPrefix);
  };

  const handleLogout = async () => {
    setActiveBuildingId(null);
    setActiveCompanyId(null);
    await auth.signOut();
    navigate("/login");
  };

  if (!activeAdminBuilding) {
    return <LoadingScreen />;
  }

  const adminPathPrefix = standaloneAdminPrefix(activeAdminBuilding.id);

  return (
    <PortalChrome>
      <BuildingAdmin
        key={activeAdminBuilding.id}
        adminPathPrefix={adminPathPrefix}
        onSwitchToResident={() => {
          setActiveBuildingId(activeAdminBuilding.id);
          auth.setActivePortal("resident");
          navigate("/resident");
        }}
        onLogout={() => void handleLogout()}
        onGoToWebsite={() => navigate("/")}
        buildingLabel={formatBuildingOptionLabel(activeAdminBuilding)}
        buildings={adminBuildings.length > 1 ? adminBuildings : undefined}
        activeBuildingId={activeAdminBuilding.id}
        onSwitchBuilding={
          adminBuildings.length > 1
            ? (building) => void handleSwitchAdminBuilding(building)
            : undefined
        }
      />
    </PortalChrome>
  );
}

function ResidentRoute() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSwitchToAdmin = async () => {
    const access = auth.portalAccess;
    if (!access?.isSuperAdmin && !access?.portals.includes("building")) {
      window.alert("You do not have access to the Building Admin portal.");
      return;
    }
    const buildingId = getActiveBuildingId() ?? access?.buildingIds[0] ?? null;
    if (buildingId) setActiveBuildingId(buildingId);

    if (access?.portals.includes("company") && access.companyId) {
      auth.setActivePortal("company");
      try {
        const buildings = await companyRepository.getBuildings();
        const building =
          (buildingId ? buildings.find((b) => b.id === buildingId) : null) ?? buildings[0] ?? null;
        if (building) {
          await companyRepository.assertBuildingAccess(building.id);
          setActiveBuildingId(building.id);
          navigate(companyBuildingAdminPrefix(building.id));
        } else {
          navigate("/company/buildings");
        }
      } catch {
        navigate("/company/buildings");
      }
      return;
    }

    auth.setActivePortal("building");
    if (buildingId) {
      navigate(standaloneAdminPrefix(buildingId));
    } else {
      navigate("/admin");
    }
  };

  const handleLogout = async () => {
    setActiveBuildingId(null);
    setActiveCompanyId(null);
    await auth.signOut();
    navigate("/login");
  };

  return (
    <PortalChrome>
      <ResidentPortal
        onSwitchToAdmin={() => void handleSwitchToAdmin()}
        onLogout={() => void handleLogout()}
        onGoToWebsite={() => navigate("/")}
      />
    </PortalChrome>
  );
}

function VendorRoute() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <PortalChrome>
      <VendorPortal onLogout={() => void handleLogout()} />
    </PortalChrome>
  );
}

function SuperAdminSwitcher() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.portalAccess?.isSuperAdmin) return null;

  return (
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
            const buildingId = getActiveBuildingId();
            if (portal === "company") navigate("/company/buildings");
            else if (portal === "admin") navigate(buildingId ? standaloneAdminPrefix(buildingId) : "/admin");
            else if (portal === "resident") navigate("/resident");
            else navigate("/vendor");
          }}
        >
          {portal}
        </button>
      ))}
    </div>
  );
}

function RecaptchaContext() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const isPortal =
    isCompanyPortalPath(pathname) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/resident") ||
    pathname.startsWith("/vendor");

  useEffect(() => {
    const isAuthenticatedPortal = Boolean(auth.session) && isPortal;
    document.body.dataset.recaptchaContext = isAuthenticatedPortal ? "authenticated" : "public";
    return () => {
      delete document.body.dataset.recaptchaContext;
    };
  }, [auth.session, isPortal]);

  return null;
}

export function PortalRoutes() {
  if (typeof window !== "undefined" && window.location.pathname === "/qbo-connected") {
    return <QboConnectedPage />;
  }

  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("previewTheme") === "1"
  ) {
    return <ThemePreviewPage onBack={() => window.history.back()} />;
  }

  return (
    <>
      <ScrollToTop />
      <RecaptchaContext />
      <SuperAdminSwitcher />
      <Routes>
        <Route path="/login" element={<GuestOnly><LoginRoute /></GuestOnly>} />
        <Route path="/change-password" element={<ChangePasswordRoute />} />
        <Route
          path="/company"
          element={
            <RequireSession>
              <RequirePasswordChanged>
                <Navigate to="/company/buildings" replace />
              </RequirePasswordChanged>
            </RequireSession>
          }
        />
        <Route
          path="/company/*"
          element={
            <RequireSession>
              <RequirePasswordChanged>
                <CompanyRoutes />
              </RequirePasswordChanged>
            </RequireSession>
          }
        />
        <Route
          path="/admin/buildings/:buildingId/*"
          element={
            <RequireSession>
              <RequirePasswordChanged>
                <StandaloneAdminPage />
              </RequirePasswordChanged>
            </RequireSession>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireSession>
              <RequirePasswordChanged>
                <StandaloneAdminPage />
              </RequirePasswordChanged>
            </RequireSession>
          }
        />
        <Route
          path="/resident/*"
          element={
            <RequireSession>
              <RequirePasswordChanged>
                <ResidentRoute />
              </RequirePasswordChanged>
            </RequireSession>
          }
        />
        <Route
          path="/vendor/*"
          element={
            <RequireSession>
              <RequirePasswordChanged>
                <VendorRoute />
              </RequirePasswordChanged>
            </RequireSession>
          }
        />
        <Route path="/*" element={<MarketingRoute />} />
      </Routes>
    </>
  );
}

/** Redirect legacy sessionStorage portal views on first load. */
export function legacyPortalRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (path !== "/") return null;
  const persisted = sessionStorage.getItem("mvpcondos_active_view");
  if (persisted === "company") return "/company/buildings";
  if (persisted === "admin") return "/admin";
  if (persisted === "resident") return "/resident";
  if (persisted === "vendor") return "/vendor";
  return null;
}
