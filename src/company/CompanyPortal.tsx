import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPortal } from "../admin/AdminPortal";
import { CompanyLayout } from "./CompanyLayout";
import { AccountPage } from "./pages/AccountPage";
import { BuildingsPage } from "./pages/BuildingsPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { MasterReportDetailPage } from "./pages/MasterReportDetailPage";
import { MasterReportsPage } from "./pages/MasterReportsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { VendorsPage } from "./pages/VendorsPage";
import { CompanyChatPage } from "./pages/CompanyChatPage";
import type { CompanyRoute } from "./navigation";
import type { CompanyBuilding } from "../resident/data/types";
import { useAuth } from "../auth/AuthProvider";
import { useCompanyBuildings, useCompanyUser } from "../shared/queries/companyQueries";
import { useInvalidatePortalQueries } from "../shared/queries/useInvalidatePortalQueries";
import { companyRepository } from "./data/companyRepository";
import {
  companyBuildingAdminPrefix,
  extractAdminSubPath,
} from "../routing/adminRoutePaths";
import {
  companyRouteToPath,
  parseCompanyBuildingAdminPath,
  parseCompanyRoute,
} from "../routing/companyRoutePaths";
import { setActiveBuildingId } from "../data/supabase/buildingContext";
import { removeBuildingQueries } from "../shared/queryInvalidation";
import { useNavigateWithBusy } from "../shared/useNavigateWithBusy";
import { DesktopPreferredBanner } from "../shared/DesktopPreferredBanner";
import {
  companyDesktopPreferredPageKey,
  isCompanyDesktopPreferred,
} from "../shared/desktopPreferredPages";

type CompanyPortalProps = {
  onOpenResidentPortal?: () => void;
  onLogout: () => void;
  onGoToWebsite?: () => void;
};

export function CompanyPortal({
  onOpenResidentPortal,
  onLogout,
  onGoToWebsite,
}: CompanyPortalProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { invalidateCompany } = useInvalidatePortalQueries();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const { data: buildings = [], refetch: refetchBuildings } = useCompanyBuildings();
  const { data: user, isLoading: userLoading } = useCompanyUser();

  const buildingAdmin = useMemo(
    () => parseCompanyBuildingAdminPath(location.pathname),
    [location.pathname]
  );

  const route = useMemo(
    () => parseCompanyRoute(location.pathname, location.search),
    [location.pathname, location.search]
  );

  const activeBuilding = useMemo(() => {
    if (!buildingAdmin) return null;
    return buildings.find((b) => b.id === buildingAdmin.buildingId) ?? null;
  }, [buildingAdmin, buildings]);

  const adminPathPrefix = activeBuilding
    ? companyBuildingAdminPrefix(activeBuilding.id)
    : "";

  useEffect(() => {
    if (activeBuilding) {
      setActiveBuildingId(activeBuilding.id);
    }
  }, [activeBuilding]);

  const refreshBuildings = useCallback(async () => {
    const result = await refetchBuildings();
    return result.data ?? [];
  }, [refetchBuildings]);

  const handleNavigateRaw = useCallback(
    (next: CompanyRoute) => {
      navigate(companyRouteToPath(next));
    },
    [navigate]
  );
  const handleNavigate = useNavigateWithBusy(handleNavigateRaw);

  const handleOpenBuilding = useCallback(
    async (building: CompanyBuilding) => {
      try {
        await companyRepository.assertBuildingAccess(building.id);
      } catch {
        window.alert("You do not have access to this building.");
        return;
      }
      queryClient.setQueryData(
        ["accessibleBuildings", auth.session?.user?.id ?? "none"],
        (prev: CompanyBuilding[] | undefined) => {
          if (!prev) return [building];
          const index = prev.findIndex((b) => b.id === building.id);
          if (index === -1) return [...prev, building];
          const next = [...prev];
          next[index] = building;
          return next;
        }
      );
      navigate(companyBuildingAdminPrefix(building.id));
    },
    [navigate, queryClient, auth.session?.user?.id]
  );

  const handleCloseBuilding = useCallback(() => {
    navigate("/company/buildings");
    void refreshBuildings();
  }, [navigate, refreshBuildings]);

  const handleSwitchBuilding = useCallback(
    async (building: CompanyBuilding) => {
      try {
        await companyRepository.assertBuildingAccess(building.id);
      } catch {
        window.alert("You do not have access to this building.");
        return;
      }
      const previousId = activeBuilding?.id;
      if (previousId && previousId !== building.id) {
        removeBuildingQueries(previousId);
      }
      const subPath = buildingAdmin
        ? extractAdminSubPath(location.pathname, companyBuildingAdminPrefix(buildingAdmin.buildingId))
        : "";
      const nextPrefix = companyBuildingAdminPrefix(building.id);
      navigate(subPath ? `${nextPrefix}/${subPath}` : nextPrefix);
    },
    [activeBuilding?.id, buildingAdmin, location.pathname, navigate]
  );

  useEffect(() => {
    if (!buildingAdmin || buildings.length === 0) return;
    const allowed = buildings.some((b) => b.id === buildingAdmin.buildingId);
    if (!allowed) {
      navigate("/company/buildings", { replace: true });
    }
  }, [buildingAdmin, buildings, navigate]);

  const handleOpenResidentPortal = () => {
    if (onOpenResidentPortal) {
      onOpenResidentPortal();
      return;
    }
    if (activeBuilding) {
      void handleOpenBuilding(activeBuilding);
    }
  };

  if (userLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7edf3] text-slate-600">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7edf3] text-red-700">
        Unable to load company profile.
      </div>
    );
  }

  return (
    <CompanyLayout
      route={route}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      onGoToWebsite={onGoToWebsite}
      user={user}
      onUserUpdated={() => void auth.refreshAuth()}
      refreshKey={refreshKey}
      activeBuilding={activeBuilding}
      onCloseBuilding={handleCloseBuilding}
    >
      {activeBuilding && adminPathPrefix ? (
        <AdminPortal
          key={activeBuilding.id}
          embedded
          adminPathPrefix={adminPathPrefix}
          buildingLabel={`(${activeBuilding.code}) ${activeBuilding.address} - ${activeBuilding.code}`}
          buildings={buildings}
          activeBuildingId={activeBuilding.id}
          onSwitchBuilding={(building) => void handleSwitchBuilding(building)}
          onOpenResidentPortal={handleOpenResidentPortal}
          onCloseBuilding={handleCloseBuilding}
        />
      ) : (
        <>
          {isCompanyDesktopPreferred(route) && (
            <DesktopPreferredBanner
              portal="company"
              pageKey={companyDesktopPreferredPageKey(route)}
            />
          )}
          {route.page === "buildings" && (
            <BuildingsPage
              onOpenBuilding={(building) => void handleOpenBuilding(building)}
              onRefreshBuildings={refreshBuildings}
              activeBuildingId={activeBuilding?.id}
              onBuildingArchived={() => handleCloseBuilding()}
              onBuildingCreated={() => {
                invalidateCompany();
                void auth.refreshAuth();
              }}
            />
          )}
          {route.page === "master-reports" && <MasterReportsPage onNavigate={handleNavigate} />}
          {route.page === "master-report-detail" && (
            <MasterReportDetailPage route={route} onNavigate={handleNavigate} />
          )}
          {route.page === "employees" && <EmployeesPage />}
          {route.page === "vendors" && <VendorsPage onNavigate={handleNavigate} />}
          {route.page === "purchase-orders" && (
            <PurchaseOrdersPage route={route} onNavigate={handleNavigate} onRefresh={bumpRefresh} />
          )}
          {route.page === "chat" && <CompanyChatPage user={user} buildings={buildings} />}
          {route.page === "account" && <AccountPage route={route} onNavigate={handleNavigate} />}
        </>
      )}
    </CompanyLayout>
  );
}
