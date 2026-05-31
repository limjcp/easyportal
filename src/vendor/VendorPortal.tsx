import { useState } from "react";
import { VendorLayout } from "./VendorLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PurchaseOrderDetailPage } from "./pages/PurchaseOrderDetailPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import type { VendorRoute } from "./navigation";

type VendorPortalProps = {
  onLogout: () => void;
};

export function VendorPortal({ onLogout }: VendorPortalProps) {
  const [route, setRoute] = useState<VendorRoute>({ page: "dashboard" });
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <VendorLayout
      route={route}
      onNavigate={setRoute}
      onLogout={onLogout}
      refreshKey={refreshKey}
    >
      {route.page === "dashboard" && (
        <DashboardPage onNavigate={setRoute} refreshKey={refreshKey} />
      )}
      {route.page === "purchase-orders" && (
        <PurchaseOrdersPage route={route} onNavigate={setRoute} refreshKey={refreshKey} />
      )}
      {route.page === "purchase-order-detail" && (
        <PurchaseOrderDetailPage
          poId={route.id}
          onNavigate={setRoute}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "profile" && <ProfilePage onRefresh={bumpRefresh} />}
    </VendorLayout>
  );
}
