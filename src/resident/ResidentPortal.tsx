import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCloudUploadAlt } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";
import type { ProfileCompletionStatus } from "../data/supabase/profileCompletion";
import { ensureActiveBuildingForUser, getActiveBuildingId } from "../data/supabase/buildingContext";
import { PortalConfigProvider, usePortalConfig } from "./context/PortalConfigContext";
import { isProfileCompletionBannerDismissed } from "./components/ProfileCompletionBanner";
import { ResidentLayout } from "./ResidentLayout";
import { residentRepo } from "./data/residentRepository";
import { IncidentReportModal } from "./modals/IncidentReportModal";
import { ProfileModal } from "./modals/ProfileModal";
import { ServiceRequestModal } from "./modals/ServiceRequestModal";
import { StatusCertificateModal } from "./modals/StatusCertificateModal";
import { SuggestionModal } from "./modals/SuggestionModal";
import { ResidentUploadDocumentModal } from "./modals/ResidentUploadDocumentModal";
import { Modal } from "../shared/Modal";
import type { ResidentRoute } from "./navigation";
import { DocumentsPage } from "./pages/DocumentsPage";
import { EventsPage } from "./pages/EventsPage";
import { FaqPage } from "./pages/FaqPage";
import { GalleryPage } from "./pages/GalleryPage";
import { GalleryAlbumPage } from "./pages/GalleryAlbumPage";
import { HomePage } from "./pages/HomePage";
import { IncidentReportsPage } from "./pages/IncidentReportsPage";
import { NewsDetailPage } from "./pages/NewsDetailPage";
import { NewsPage } from "./pages/NewsPage";
import { ServiceRequestsPage } from "./pages/ServiceRequestsPage";
import { StatusCertificatesPage } from "./pages/StatusCertificatesPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";
import { ResidentDetailPage } from "./pages/ResidentDetailPage";
import { BoardMemberPage } from "./pages/BoardMemberPage";
import { ElectionsPage } from "./pages/ElectionsPage";
import { ElectionVotePage } from "./pages/ElectionVotePage";
import { PollsPage } from "./pages/PollsPage";
import { FireSafetyPlanPage } from "./pages/FireSafetyPlanPage";
import { ResidentChatPage } from "./pages/ResidentChatPage";
import { AmenityBookingsPage } from "./pages/AmenityBookingsPage";
import { routePageToDetailSection } from "./data/residentDetailConfig";
import {
  RESIDENT_PATH_PREFIX,
  buildResidentPath,
  extractResidentSubPath,
  pathToResidentRoute,
} from "../routing/residentRoutePaths";
import { queryKeys } from "../shared/queryKeys";
import { useInvalidatePortalQueries } from "../shared/queries/useInvalidatePortalQueries";
import { useTenantContext } from "../shared/queries/useTenantContext";
import { useNavigateWithBusy } from "../shared/useNavigateWithBusy";
import { DesktopPreferredBanner } from "../shared/DesktopPreferredBanner";
import {
  isResidentDesktopPreferred,
  residentDesktopPreferredPageKey,
} from "../shared/desktopPreferredPages";
import type { ServiceRequest } from "./data/types";

type ResidentPortalProps = {
  onSwitchToAdmin: () => void;
  onLogout: () => void;
  onGoToWebsite?: () => void;
};

export function ResidentPortal({ onSwitchToAdmin, onLogout, onGoToWebsite }: ResidentPortalProps) {
  const auth = useAuth();
  const [buildingKey, setBuildingKey] = useState<string | null>(() => getActiveBuildingId());
  const [buildingError, setBuildingError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.session?.user) return;
    let cancelled = false;
    ensureActiveBuildingForUser(auth.session.user.id)
      .then((id) => {
        if (!cancelled) setBuildingKey(id);
      })
      .catch((err) => {
        if (!cancelled) {
          setBuildingError(err instanceof Error ? err.message : "Failed to load building context.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.session?.user?.id]);

  if (buildingError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7edf3] px-4 text-center text-red-700">
        {buildingError}
      </div>
    );
  }

  return (
    <PortalConfigProvider buildingKey={buildingKey}>
      <ResidentPortalInner
        onSwitchToAdmin={onSwitchToAdmin}
        onLogout={onLogout}
        onGoToWebsite={onGoToWebsite}
      />
    </PortalConfigProvider>
  );
}

function ResidentPortalInner({ onSwitchToAdmin, onLogout, onGoToWebsite }: ResidentPortalProps) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const route = useMemo(() => {
    const sub = extractResidentSubPath(location.pathname, RESIDENT_PATH_PREFIX);
    return pathToResidentRoute(sub);
  }, [location.pathname]);
  const navigateRaw = useCallback(
    (next: ResidentRoute) => {
      routerNavigate(buildResidentPath(RESIDENT_PATH_PREFIX, next));
    },
    [routerNavigate]
  );
  const navigate = useNavigateWithBusy(navigateRaw);

  useEffect(() => {
    const sub = extractResidentSubPath(location.pathname, RESIDENT_PATH_PREFIX);
    const parsed = pathToResidentRoute(sub);
    const canonical = buildResidentPath(RESIDENT_PATH_PREFIX, parsed);
    if (location.pathname !== canonical) {
      routerNavigate(canonical, { replace: true });
    }
  }, [location.pathname, routerNavigate]);

  useEffect(() => {
    let cancelled = false;
    residentRepo
      .getProfileCompletionStatus()
      .then((status) => {
        if (!cancelled) setProfileCompletionStatus(status);
      })
      .catch(() => {
        if (!cancelled) setProfileCompletionStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { publicPortalSettings } = usePortalConfig();
  const themeColor = publicPortalSettings.portalThemeColor;
  const [profileOpen, setProfileOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [statusCertModalOpen, setStatusCertModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [rsvpsOpen, setRsvpsOpen] = useState(false);
  const [listRefresh, setListRefresh] = useState(0);
  const [profileCompletionStatus, setProfileCompletionStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(isProfileCompletionBannerDismissed);
  const { queryClient } = useInvalidatePortalQueries();
  const { userId, buildingId } = useTenantContext();

  const bumpList = () => setListRefresh((k) => k + 1);

  const navAction = getNavAction(route, themeColor, {
    onAddService: () => setServiceModalOpen(true),
    onAddIncident: () => setIncidentModalOpen(true),
    onAddSuggestion: () => setSuggestionModalOpen(true),
    onAddStatusCert: () => setStatusCertModalOpen(true),
    onUploadDocs: () => setUploadOpen(true),
    onRsvps: () => setRsvpsOpen(true),
  });

  const fullWidth = route.page !== "home";

  const showProfileCompletionBanner =
    profileCompletionStatus?.phase === "soft" && !profileBannerDismissed;

  return (
    <>
      <ResidentLayout
        route={route}
        onNavigate={navigate}
        onSwitchToAdmin={onSwitchToAdmin}
        onOpenProfile={() => setProfileOpen(true)}
        onLogout={onLogout}
        onGoToWebsite={onGoToWebsite}
        navAction={navAction}
        fullWidth={fullWidth}
        profileCompletionBanner={
          showProfileCompletionBanner
            ? {
                missingCount: profileCompletionStatus.missingFields.length,
                onComplete: () => routerNavigate("/complete-profile"),
                onDismiss: () => setProfileBannerDismissed(true),
              }
            : undefined
        }
      >
        {isResidentDesktopPreferred(route) && (
          <DesktopPreferredBanner
            portal="resident"
            pageKey={residentDesktopPreferredPageKey(route)}
          />
        )}
        {renderPage(route, navigate, listRefresh, {
          onAddService: () => setServiceModalOpen(true),
          onAddIncident: () => setIncidentModalOpen(true),
          onAddSuggestion: () => setSuggestionModalOpen(true),
          onAddStatusCert: () => setStatusCertModalOpen(true),
        })}
      </ResidentLayout>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      <ServiceRequestModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSubmit={async (input) => {
          const created = await residentRepo.createServiceRequest(input);
          if (userId && buildingId) {
            queryClient.setQueryData<ServiceRequest[]>(
              queryKeys.building.residentServiceRequests(userId, buildingId),
              (old) => {
                if (!old) return [created];
                if (old.some((row) => row.id === created.id)) return old;
                return [created, ...old];
              }
            );
          }
        }}
      />

      <IncidentReportModal
        open={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        onSubmit={async (input) => {
          await residentRepo.createIncidentReport(input);
          bumpList();
        }}
      />

      <SuggestionModal
        open={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
        onSubmit={async (text) => {
          await residentRepo.createSuggestion({ text });
          bumpList();
        }}
      />

      <StatusCertificateModal
        open={statusCertModalOpen}
        onClose={() => setStatusCertModalOpen(false)}
        onSubmit={async (input) => {
          await residentRepo.createStatusCertificate(input);
          bumpList();
        }}
      />

      <ResidentUploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={bumpList}
      />

      <RsvpsModal open={rsvpsOpen} onClose={() => setRsvpsOpen(false)} />
    </>
  );
}

function getNavAction(
  route: ResidentRoute,
  themeColor: string,
  handlers: {
    onAddService: () => void;
    onAddIncident: () => void;
    onAddSuggestion: () => void;
    onAddStatusCert: () => void;
    onUploadDocs: () => void;
    onRsvps: () => void;
  }
) {
  switch (route.page) {
    case "service-requests":
      return (
        <NavButton themeColor={themeColor} onClick={handlers.onAddService} label="+ Add A Service Request" />
      );
    case "incident-reports":
      return (
        <NavButton themeColor={themeColor} onClick={handlers.onAddIncident} label="+ Add An Incident Report" />
      );
    case "suggestions":
      return (
        <NavButton themeColor={themeColor} onClick={handlers.onAddSuggestion} label="+ Add A New Suggestion" />
      );
    case "documents":
      return (
        <NavButton themeColor={themeColor} onClick={handlers.onUploadDocs} label="Upload Documents" icon={<FaCloudUploadAlt />} />
      );
    case "events":
      return <NavButton themeColor={themeColor} onClick={handlers.onRsvps} label="My RSVPs" />;
    case "status-certificates":
      return (
        <NavButton
          themeColor={themeColor}
          onClick={handlers.onAddStatusCert}
          label="+ Request Certificate"
        />
      );
    default:
      return null;
  }
}

function NavButton({
  onClick,
  label,
  icon,
  themeColor,
}: {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  themeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 sm:text-sm"
      style={{ backgroundColor: themeColor }}
    >
      {icon}
      {label}
    </button>
  );
}

function renderPage(
  route: ResidentRoute,
  onNavigate: (r: ResidentRoute) => void,
  refreshKey: number,
  handlers: {
    onAddService: () => void;
    onAddIncident: () => void;
    onAddSuggestion: () => void;
    onAddStatusCert: () => void;
  }
) {
  switch (route.page) {
    case "home":
      return <HomePage onNavigate={onNavigate} badgeRefreshKey={refreshKey} />;
    case "news":
      return <NewsPage onNavigate={onNavigate} />;
    case "news-detail":
      return <NewsDetailPage id={route.id} />;
    case "documents":
      return <DocumentsPage refreshKey={refreshKey} />;
    case "service-requests":
      return <ServiceRequestsPage onAddNew={handlers.onAddService} refreshKey={refreshKey} />;
    case "incident-reports":
      return <IncidentReportsPage onAddNew={handlers.onAddIncident} refreshKey={refreshKey} />;
    case "suggestions":
      return <SuggestionsPage onAddNew={handlers.onAddSuggestion} refreshKey={refreshKey} />;
    case "events":
      return <EventsPage />;
    case "gallery":
      return <GalleryPage onNavigate={onNavigate} />;
    case "gallery-detail":
      return <GalleryAlbumPage albumId={route.id} />;
    case "faq":
      return <FaqPage />;
    case "status-certificates":
      return (
        <StatusCertificatesPage onAddNew={handlers.onAddStatusCert} refreshKey={refreshKey} />
      );
    case "parking-spots":
    case "lockers":
    case "key-fobs":
    case "vehicles":
    case "guest-list":
    case "bike-spaces":
    case "pets":
    case "purchase-date-maint-fees": {
      const section = routePageToDetailSection(route.page);
      if (!section) return <HomePage onNavigate={onNavigate} />;
      return <ResidentDetailPage section={section} />;
    }
    case "board-member":
      return <BoardMemberPage />;
    case "board-elections":
      return <ElectionsPage onNavigate={onNavigate} />;
    case "board-election-vote":
      return (
        <ElectionVotePage electionId={route.electionId} onNavigate={onNavigate} />
      );
    case "polls":
      return <PollsPage />;
    case "fire-safety-plan":
      return <FireSafetyPlanPage />;
    case "chat":
      return <ResidentChatPage />;
    case "amenity-bookings":
      return <AmenityBookingsPage refreshKey={refreshKey} />;
    default:
      return <HomePage onNavigate={onNavigate} />;
  }
}

function RsvpsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rsvps, setRsvps] = useState<{ id: string; eventTitle: string; date: string; status: string }[]>([]);

  useEffect(() => {
    if (open) residentRepo.getRsvps().then(setRsvps);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="My RSVPs" size="md">
      <RsvpsList rsvps={rsvps} />
    </Modal>
  );
}

function RsvpsList({ rsvps }: { rsvps: { id: string; eventTitle: string; date: string; status: string }[] }) {
  if (rsvps.length === 0) {
    return <p className="text-sm text-slate-500">You have no RSVPs.</p>;
  }
  return (
    <ul className="space-y-2">
      {rsvps.map((r) => (
        <li key={r.id} className="rounded border border-slate-200 px-3 py-2 text-sm">
          <p className="font-medium text-slate-800">{r.eventTitle}</p>
          <p className="text-slate-500">
            {r.date} — {r.status}
          </p>
        </li>
      ))}
    </ul>
  );
}
