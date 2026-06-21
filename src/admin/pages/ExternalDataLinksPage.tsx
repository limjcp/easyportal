import { AdminTabs } from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute } from "../navigation";
import type { ExternalDataTab } from "../../resident/data/types";
import { QuickBooksTab } from "./external-data/QuickBooksTab";
import { StripePaymentsTab } from "./external-data/StripePaymentsTab";

const TABS: { id: ExternalDataTab; label: string }[] = [
  { id: "stripe", label: "Stripe Online Payments" },
  { id: "quickbooks", label: "QuickBooks" },
];

type ExternalDataLinksPageProps = {
  route: AdminRoute & { page: "external-data-links" };
  onNavigate: (route: AdminRoute) => void;
  activeBuildingId?: string;
  refreshKey?: number;
};

export function ExternalDataLinksPage({
  route,
  onNavigate,
  activeBuildingId,
  refreshKey,
}: ExternalDataLinksPageProps) {
  const handleTabChange = (tabId: string) => {
    onNavigate({ page: "external-data-links", tab: tabId as ExternalDataTab });
  };

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />
      <AdminTabs tabs={TABS} activeTab={route.tab} onChange={handleTabChange} />
      <div className="rounded-sm border border-slate-200 bg-white p-4">
        {route.tab === "stripe" && <StripePaymentsTab />}
        {route.tab === "quickbooks" && (
          <QuickBooksTab activeBuildingId={activeBuildingId} refreshKey={refreshKey} />
        )}
      </div>
    </>
  );
}
