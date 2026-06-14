import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getPersistedAdminRoute, setPersistedAdminRoute } from "../auth/persistedAdminRoute";
import { getEffectiveBuildingAdminModuleAccessForUser } from "../data/supabase/portalModulePermissions";
import { AdminLayout } from "./AdminLayout";
import { adminRepository } from "./data/adminRepository";
import type { AdminRoute } from "./navigation";
import { isAdminRouteAllowed } from "./navigation";
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
import { NewsletterEditPage } from "./pages/NewsletterEditPage";
import { NewslettersPage } from "./pages/NewslettersPage";
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
import { ToastProvider } from "../shared/Toast";

type AdminPortalProps = {
  onSwitchToResident?: () => void;
  onLogout?: () => void;
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
  onSwitchToResident,
  onLogout,
  buildingLabel,
  buildings,
  activeBuildingId,
  onSwitchBuilding,
  onOpenResidentPortal,
  onBackToCompany,
  onCloseBuilding,
  embedded = false,
}: AdminPortalProps) {
  const auth = useAuth();
  const [route, setRouteState] = useState<AdminRoute>(
    () => getPersistedAdminRoute() ?? { page: "dashboard" }
  );
  const navigate = useCallback((next: AdminRoute) => {
    setRouteState(next);
    setPersistedAdminRoute(next);
  }, []);
  const [refreshKey, setRefreshKey] = useState(0);
  const [navAccess, setNavAccess] = useState<Map<string, boolean> | null>(null);
  const [unreadSuggestions, setUnreadSuggestions] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [unreadBoardApplications, setUnreadBoardApplications] = useState(0);
  const [unreadConsultationLeads, setUnreadConsultationLeads] = useState(0);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    adminRepository.getUnreadSuggestionCount().then(setUnreadSuggestions);
    adminRepository.getPendingBoardApprovalCount().then(setPendingApprovals);
    adminRepository.getUnreadBoardApplicationCount().then(setUnreadBoardApplications);
    adminRepository.getUnreadConsultationLeadCount().then(setUnreadConsultationLeads);
  }, [refreshKey]);

  useEffect(() => {
    const userId = auth.session?.user?.id;
    if (!userId || !activeBuildingId) {
      setNavAccess(null);
      return;
    }
    getEffectiveBuildingAdminModuleAccessForUser(userId, activeBuildingId)
      .then(setNavAccess)
      .catch(() => setNavAccess(null));
  }, [auth.session?.user?.id, activeBuildingId]);

  useEffect(() => {
    if (!isAdminRouteAllowed(route, navAccess)) {
      const fallback: AdminRoute = { page: "dashboard" };
      setRouteState(fallback);
      setPersistedAdminRoute(fallback);
    }
  }, [route, navAccess]);

  return (
    <ToastProvider>
    <AdminLayout
      route={route}
      onNavigate={navigate}
      onSwitchToResident={onSwitchToResident}
      onLogout={onLogout}
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
        <ExternalDataLinksPage route={route} onNavigate={navigate} />
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
      {route.page === "newsletters" && (
        <NewslettersPage
          route={route}
          onNavigate={navigate}
          refreshKey={refreshKey}
          onRefresh={bumpRefresh}
        />
      )}
      {route.page === "newsletter-edit" && (
        <NewsletterEditPage route={route} onNavigate={navigate} onRefresh={bumpRefresh} />
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
    </ToastProvider>
  );
}
