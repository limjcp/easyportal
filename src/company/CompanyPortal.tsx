import { useCallback, useEffect, useState } from "react";
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

type CompanyPortalProps = {
  activeBuilding: CompanyBuilding | null;
  onOpenBuilding: (building: CompanyBuilding) => void;
  onCloseBuilding: () => void;
  onOpenResidentPortal?: () => void;
  onLogout: () => void;
  onGoToWebsite?: () => void;
};

export function CompanyPortal({
  activeBuilding,
  onOpenBuilding,
  onCloseBuilding,
  onOpenResidentPortal,
  onLogout,
  onGoToWebsite,
}: CompanyPortalProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { invalidateCompany } = useInvalidatePortalQueries();
  const [route, setRoute] = useState<CompanyRoute>({ page: "buildings" });
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const { data: buildings = [], refetch: refetchBuildings } = useCompanyBuildings();
  const { data: user, isLoading: userLoading } = useCompanyUser();

  const refreshBuildings = useCallback(async () => {
    const result = await refetchBuildings();
    return result.data ?? [];
  }, [refetchBuildings]);

  const handleOpenBuilding = useCallback(
    async (building: CompanyBuilding) => {
      try {
        await companyRepository.assertBuildingAccess(building.id);
      } catch {
        window.alert("You do not have access to this building.");
        return;
      }
      onOpenBuilding(building);
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
    },
    [onOpenBuilding, queryClient, auth.session?.user?.id]
  );

  const handleCloseBuilding = useCallback(() => {
    onCloseBuilding();
    void refreshBuildings();
  }, [onCloseBuilding, refreshBuildings]);

  const handleNavigate = (next: CompanyRoute) => {
    if (activeBuilding) {
      handleCloseBuilding();
    }
    setRoute(next);
  };

  useEffect(() => {
    if (!activeBuilding) return;
    const allowed = buildings.some((b) => b.id === activeBuilding.id);
    if (!allowed && buildings.length > 0) {
      onCloseBuilding();
    }
  }, [activeBuilding, buildings, onCloseBuilding]);

  const handleOpenResidentPortal = () => {
    if (onOpenResidentPortal) {
      onOpenResidentPortal();
      return;
    }
    if (activeBuilding) {
      onOpenBuilding(activeBuilding);
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
      {activeBuilding ? (
        <AdminPortal
          key={activeBuilding.id}
          embedded
          buildingLabel={`(${activeBuilding.code}) ${activeBuilding.address} - ${activeBuilding.code}`}
          buildings={buildings}
          activeBuildingId={activeBuilding.id}
          onSwitchBuilding={handleOpenBuilding}
          onOpenResidentPortal={handleOpenResidentPortal}
        />
      ) : (
        <>
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
          {route.page === "master-reports" && <MasterReportsPage onNavigate={setRoute} />}
          {route.page === "master-report-detail" && (
            <MasterReportDetailPage route={route} onNavigate={setRoute} />
          )}
          {route.page === "employees" && <EmployeesPage />}
          {route.page === "vendors" && <VendorsPage onNavigate={setRoute} />}
          {route.page === "purchase-orders" && (
            <PurchaseOrdersPage route={route} onNavigate={setRoute} onRefresh={bumpRefresh} />
          )}
          {route.page === "chat" && <CompanyChatPage user={user} buildings={buildings} />}
          {route.page === "account" && <AccountPage route={route} onNavigate={setRoute} />}
        </>
      )}
    </CompanyLayout>
  );
}
