import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  buildAdminPath,
  extractAdminSubPath,
  pathToAdminRoute,
} from "../routing/adminRoutePaths";
import { AdminLayout } from "./AdminLayout";
import { adminRepository } from "./data/adminRepository";
import type { AdminRoute } from "./navigation";
import { isAdminRouteAllowed } from "./navigation";
import { useBuildingBadgeCounts, useBuildingNavAccess } from "../shared/queries/buildingQueries";
import { AdminPageActions } from "./components/AdminPageActions";
import { AdminDocumentsPage } from "./pages/AdminDocumentsPage";
import { AdminEventsPage } from "./pages/AdminEventsPage";
import { AdminFaqPage } from "./pages/AdminFaqPage";
import { BoardApprovalsPage } from "./pages/BoardApprovalsPage";
import { BoardMembersPage } from "./pages/BoardMembersPage";
import { BoardElectionsPage } from "./pages/BoardElectionsPage";
import { ElectionEditPage } from "./pages/ElectionEditPage";
import { BoardApplicationDetailPage } from "./pages/BoardApplicationDetailPage";
import { FireSafetySubmissionsPage } from "./pages/FireSafetySubmissionsPage";
import { AmenityBookingsPage } from "./pages/AmenityBookingsPage";
import { BuildingDefinitionPage } from "./pages/BuildingDefinitionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GalleriesPage } from "./pages/GalleriesPage";
import { IncidentReportsPage } from "./pages/IncidentReportsPage";
import { NewsNoticeEditPage } from "./pages/NewsNoticeEditPage";
import { NewsNoticesPage } from "./pages/NewsNoticesPage";
import { PortalSettingsPage } from "./pages/PortalSettingsPage";
import { ServiceRequestsPage } from "./pages/ServiceRequestsPage";
import { SuggestionDetailPage } from "./pages/SuggestionDetailPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";
import { PollEditPage } from "./pages/PollEditPage";
import { PollsPage } from "./pages/PollsPage";
import { UnitsUsersPage } from "./pages/UnitsUsersPage";
import { AdminChatPage } from "./pages/AdminChatPage";
import { ExternalDataLinksPage } from "./pages/ExternalDataLinksPage";
import { AdminsPage } from "./pages/AdminsPage";
import { AdminStatusCertificatesPage } from "./pages/AdminStatusCertificatesPage";
import { AgmMeetingsPage } from "./pages/AgmMeetingsPage";
import { ComplianceDashboardPage } from "./pages/ComplianceDashboardPage";
import { ConsultationLeadsPage } from "./pages/ConsultationLeadsPage";
import type { CompanyBuilding } from "../resident/data/types";
import { setActiveBuildingId } from "../data/supabase/buildingContext";
import { useNavigateWithBusy } from "../shared/useNavigateWithBusy";

type AdminPortalProps = {
  adminPathPrefix: string;
  onSwitchToResident?: () => void;
  onLogout?: () => void;
  onGoToWebsite?: () => void;
  buildingLabel?: string;
  buildings?: CompanyBuilding[];
  activeBuildingId?: string;
  onSwitchBuilding?: (building: CompanyBuilding) => void;
  onOpenResidentPortal?: () => void;
  onBackToCompany?: () => void;
  onCloseBuilding?: () => void;
  embedded?: boolean;
};

export function AdminPortal({
  adminPathPrefix,
  onSwitchToResident,
  onLogout,
  onGoToWebsite,
  buildingLabel,
  buildings,
  activeBuildingId,
  onSwitchBuilding,
  onOpenResidentPortal,
  onBackToCompany,
  onCloseBuilding,
  embedded = false,
}: AdminPortalProps) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const route = useMemo(() => {
    const sub = extractAdminSubPath(location.pathname, adminPathPrefix);
    return pathToAdminRoute(sub, location.search);
  }, [location.pathname, location.search, adminPathPrefix]);
  const navigateRaw = useCallback(
    (next: AdminRoute) => {
      routerNavigate(buildAdminPath(adminPathPrefix, next));
    },
    [adminPathPrefix, routerNavigate]
  );
  const navigate = useNavigateWithBusy(navigateRaw);
  const [refreshKey, setRefreshKey] = useState(0);

  // bumpRefresh increments refreshKey so mounted pages refetch locally (syncFromRefreshKey).
  // Child pages must NOT call onRefresh from their refreshKey listener — that would loop.
  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const { data: badgeCounts } = useBuildingBadgeCounts();
  const unreadSuggestions = badgeCounts?.unreadSuggestions ?? 0;
  const pendingApprovals = badgeCounts?.pendingApprovals ?? 0;
  const unreadBoardApplications = badgeCounts?.unreadBoardApplications ?? 0;
  const unreadConsultationLeads = badgeCounts?.unreadConsultationLeads ?? 0;

  const { data: navAccess = null } = useBuildingNavAccess();

  useEffect(() => {
    if (!activeBuildingId) return;
    setActiveBuildingId(activeBuildingId);
    setRefreshKey((k) => k + 1);
  }, [activeBuildingId]);

  useEffect(() => {
    if (!isAdminRouteAllowed(route, navAccess)) {
      navigate({ page: "dashboard" });
    }
  }, [route, navAccess, navigate]);

  return (
    <AdminLayout
      route={route}
      onNavigate={navigate}
      onSwitchToResident={onSwitchToResident}
      onLogout={onLogout}
      onGoToWebsite={onGoToWebsite}
      buildingLabel={buildingLabel}
      buildings={buildings}
      activeBuildingId={activeBuildingId}
      onSwitchBuilding={onSwitchBuilding}
      onOpenResidentPortal={onOpenResidentPortal}
      onBackToCompany={onBackToCompany}
      onCloseBuilding={onCloseBuilding}
      embedded={embedded}
      navAccess={navAccess}
    >
      {route.page === "dashboard" && (
        <>
          <AdminPageActions route={route} onNavigate={navigate} />
          <DashboardPage
            refreshKey={refreshKey}
            onNavigate={navigate}
            unreadSuggestions={unreadSuggestions}
            pendingApprovals={pendingApprovals}
            unreadBoardApplications={unreadBoardApplications}
            unreadConsultationLeads={unreadConsultationLeads}
          />
        </>
      )}
      {route.page === "consultation-leads" && (
        <ConsultationLeadsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "building-definition" && (
        <BuildingDefinitionPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "external-data-links" && (
        <ExternalDataLinksPage
          route={route}
          onNavigate={navigate}
          activeBuildingId={activeBuildingId}
          refreshKey={refreshKey}
        />
      )}
      {route.page === "portal-settings" && (
        <PortalSettingsPage route={route} onNavigate={navigate} />
      )}
      {route.page === "admins" && (
        <AdminsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "board-approvals" && (
        <BoardApprovalsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "board-members" && (
        <BoardMembersPage route={route} onNavigate={navigate} refreshKey={refreshKey} />
      )}
      {route.page === "board-application-detail" && (
        <BoardApplicationDetailPage
          route={route}
          onNavigate={navigate}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "board-elections" && (
        <BoardElectionsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "board-election-edit" && (
        <ElectionEditPage route={route} onNavigate={navigate} />
      )}
      {route.page === "agm" && (
        <AgmMeetingsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "compliance-dashboard" && <ComplianceDashboardPage />}
      {route.page === "fire-safety" && (
        <FireSafetySubmissionsPage route={route} onNavigate={navigate} refreshKey={refreshKey} />
      )}
      {route.page === "amenity-bookings" && (
        <AmenityBookingsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "documents" && (
        <AdminDocumentsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "events" && (
        <AdminEventsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "faq" && (
        <AdminFaqPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "galleries" && (
        <GalleriesPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "incident-reports" && (
        <IncidentReportsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "news-notices" && (
        <NewsNoticesPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "news-notice-edit" && (
        <NewsNoticeEditPage route={route} onNavigate={navigate} onRefresh={bumpRefresh} />
      )}
      {route.page === "polls" && (
        <PollsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "poll-edit" && (
        <PollEditPage route={route} onNavigate={navigate} />
      )}
      {route.page === "service-requests" && (
        <ServiceRequestsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "status-certificates" && (
        <AdminStatusCertificatesPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
        />
      )}
      {route.page === "suggestions" && (
        <SuggestionsPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "suggestion-detail" && (
        <SuggestionDetailPage route={route} onNavigate={navigate} />
      )}
      {route.page === "units-users" && (
        <UnitsUsersPage refreshKey={refreshKey} onRefresh={bumpRefresh} />
      )}
      {route.page === "chat" && (
        <AdminChatPage activeBuildingId={activeBuildingId} embedded={embedded} />
      )}
    </AdminLayout>
  );
}
