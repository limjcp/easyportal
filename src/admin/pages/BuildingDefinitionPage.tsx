import { AdminTabs } from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute, BuildingDefinitionTab } from "../navigation";
import { AmenitiesTab } from "./building-definition/AmenitiesTab";
import { BuildingTab } from "./building-definition/BuildingTab";
import { LockersTab } from "./building-definition/LockersTab";
import { ParkingTab } from "./building-definition/ParkingTab";
import { RemindersTab } from "./building-definition/RemindersTab";
import { TaxTab } from "./building-definition/TaxTab";
import { UnitGroupsTab } from "./building-definition/UnitGroupsTab";
import { UnitsTab } from "./building-definition/UnitsTab";

type BuildingDefinitionPageProps = {
  route: AdminRoute & { page: "building-definition" };
  onNavigate: (route: AdminRoute) => void;
  refreshKey: number;
  onRefresh: () => void;
};

const TABS: { id: BuildingDefinitionTab; label: string }[] = [
  { id: "building", label: "Building" },
  { id: "tax", label: "Tax" },
  { id: "units", label: "Units" },
  { id: "unit-groups", label: "Unit Groups" },
  { id: "parking", label: "Parking" },
  { id: "lockers", label: "Lockers" },
  { id: "amenities", label: "Amenities" },
  { id: "reminders", label: "Reminders" },
];

export function BuildingDefinitionPage({
  route,
  onNavigate,
  refreshKey,
  onRefresh,
}: BuildingDefinitionPageProps) {
  const handleTabChange = (tabId: string) => {
    onNavigate({ page: "building-definition", tab: tabId as BuildingDefinitionTab });
  };

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />
      <AdminTabs tabs={TABS} activeTab={route.tab} onChange={handleTabChange} />
      {route.tab === "building" && <BuildingTab refreshKey={refreshKey} onRefresh={onRefresh} />}
      {route.tab === "tax" && <TaxTab />}
      {route.tab === "units" && <UnitsTab refreshKey={refreshKey} onRefresh={onRefresh} />}
      {route.tab === "unit-groups" && <UnitGroupsTab refreshKey={refreshKey} onRefresh={onRefresh} />}
      {route.tab === "parking" && <ParkingTab refreshKey={refreshKey} onRefresh={onRefresh} />}
      {route.tab === "lockers" && <LockersTab refreshKey={refreshKey} onRefresh={onRefresh} />}
      {route.tab === "amenities" && <AmenitiesTab refreshKey={refreshKey} onRefresh={onRefresh} />}
      {route.tab === "reminders" && <RemindersTab refreshKey={refreshKey} onRefresh={onRefresh} />}
    </>
  );
}
