import { useEffect, useState } from "react";
import { AdminPortal } from "../admin/AdminPortal";
import { CompanyLayout } from "./CompanyLayout";
import { companyRepository } from "./data/companyRepository";
import { AccountPage } from "./pages/AccountPage";
import { BuildingsPage } from "./pages/BuildingsPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { MasterReportDetailPage } from "./pages/MasterReportDetailPage";
import { MasterReportsPage } from "./pages/MasterReportsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { VendorsPage } from "./pages/VendorsPage";
import { CompanyChatPage } from "./pages/CompanyChatPage";
import type { CompanyRoute } from "./navigation";
import type { CompanyBuilding, CompanyUser } from "../resident/data/types";

type CompanyPortalProps = {
  activeBuilding: CompanyBuilding | null;
  onOpenBuilding: (building: CompanyBuilding) => void;
  onCloseBuilding: () => void;
  onOpenResidentPortal?: () => void;
  onLogout: () => void;
};

export function CompanyPortal({
  activeBuilding,
  onOpenBuilding,
  onCloseBuilding,
  onOpenResidentPortal,
  onLogout,
}: CompanyPortalProps) {
  const [route, setRoute] = useState<CompanyRoute>({ page: "buildings" });
  const [user, setUser] = useState<CompanyUser | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const [buildings, setBuildings] = useState<CompanyBuilding[]>([]);

  const handleNavigate = (next: CompanyRoute) => {
    if (activeBuilding) {
      onCloseBuilding();
    }
    setRoute(next);
  };

  useEffect(() => {
    companyRepository.getCompanyUser().then(setUser);
    companyRepository.getBuildings().then(setBuildings);
  }, []);

  const handleOpenResidentPortal = () => {
    if (onOpenResidentPortal) {
      onOpenResidentPortal();
      return;
    }
    if (activeBuilding) {
      onOpenBuilding(activeBuilding);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7edf3] text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <CompanyLayout
      route={route}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      user={user}
      onUserUpdated={setUser}
      refreshKey={refreshKey}
      activeBuilding={activeBuilding}
      onCloseBuilding={onCloseBuilding}
    >
      {activeBuilding ? (
        <AdminPortal
          embedded
          buildingLabel={`(${activeBuilding.code}) ${activeBuilding.address} - ${activeBuilding.code}`}
          buildings={buildings}
          activeBuildingId={activeBuilding.id}
          onSwitchBuilding={onOpenBuilding}
          onOpenResidentPortal={handleOpenResidentPortal}
        />
      ) : (
        <>
          {route.page === "buildings" && <BuildingsPage onOpenBuilding={onOpenBuilding} />}
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
