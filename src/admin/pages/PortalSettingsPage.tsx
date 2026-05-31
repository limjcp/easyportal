import { useState } from "react";
import { AdminTabs } from "../components/AdminPanelTable";
import { AdminPageActions } from "../components/AdminPageActions";
import type { AdminRoute, PortalSettingsTab } from "../navigation";
import { ModulesTab } from "./portal-settings/ModulesTab";
import { ProfileTab } from "./portal-settings/ProfileTab";
import { PublicDocumentsTab } from "./portal-settings/PublicDocumentsTab";
import { PublicImagesTab } from "./portal-settings/PublicImagesTab";
import { PublicSettingsTab } from "./portal-settings/PublicSettingsTab";
import { RegistrationTab } from "./portal-settings/RegistrationTab";
import { ResidentImagesTab } from "./portal-settings/ResidentImagesTab";

const TABS: { id: PortalSettingsTab; label: string }[] = [
  { id: "public-settings", label: "Public Portal Settings" },
  { id: "public-images", label: "Public Portal Images" },
  { id: "public-documents", label: "Public Portal Documents" },
  { id: "resident-images", label: "Resident Portal Images" },
  { id: "modules", label: "Resident Portal Tiles/Modules" },
  { id: "registration", label: "Resident Portal Registration" },
  { id: "profile", label: "Resident Portal Profile" },
];

type PortalSettingsPageProps = {
  route: AdminRoute & { page: "portal-settings" };
  onNavigate: (route: AdminRoute) => void;
};

export function PortalSettingsPage({ route, onNavigate }: PortalSettingsPageProps) {
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  const handleTabChange = (tabId: string) => {
    onNavigate({ page: "portal-settings", tab: tabId as PortalSettingsTab });
  };

  return (
    <>
      <AdminPageActions route={route} onNavigate={onNavigate} />
      <AdminTabs tabs={TABS} activeTab={route.tab} onChange={handleTabChange} />
      {route.tab === "public-settings" && <PublicSettingsTab />}
      {route.tab === "public-images" && <PublicImagesTab refreshKey={imageRefreshKey} />}
      {route.tab === "public-documents" && <PublicDocumentsTab />}
      {route.tab === "resident-images" && <ResidentImagesTab refreshKey={imageRefreshKey} />}
      {route.tab === "modules" && <ModulesTab />}
      {route.tab === "registration" && <RegistrationTab />}
      {route.tab === "profile" && <ProfileTab />}
    </>
  );
}
