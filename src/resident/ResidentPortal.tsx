import { useEffect, useState, type ReactNode } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import { Modal } from "../shared/Modal";
import { PortalConfigProvider } from "./context/PortalConfigContext";
import { getPortalConfig } from "./data/portalConfig";
import { ResidentLayout } from "./ResidentLayout";
import { residentRepo } from "./data/mockRepository";
import { IncidentReportModal } from "./modals/IncidentReportModal";
import { ProfileModal } from "./modals/ProfileModal";
import { ServiceRequestModal } from "./modals/ServiceRequestModal";
import { StatusCertificateModal } from "./modals/StatusCertificateModal";
import { SuggestionModal } from "./modals/SuggestionModal";
import type { ResidentRoute } from "./navigation";
import { DocumentsPage } from "./pages/DocumentsPage";
import { EventsPage } from "./pages/EventsPage";
import { FaqPage } from "./pages/FaqPage";
import { GalleryPage } from "./pages/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { IncidentReportsPage } from "./pages/IncidentReportsPage";
import { NewsDetailPage } from "./pages/NewsDetailPage";
import { NewsPage } from "./pages/NewsPage";
import { NewsletterDetailPage } from "./pages/NewsletterDetailPage";
import { NewslettersPage } from "./pages/NewslettersPage";
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
import { routePageToDetailSection } from "./data/residentDetailConfig";

type ResidentPortalProps = {
  onSwitchToAdmin: () => void;
  onLogout: () => void;
};

export function ResidentPortal({ onSwitchToAdmin, onLogout }: ResidentPortalProps) {
  return (
    <PortalConfigProvider>
      <ResidentPortalInner onSwitchToAdmin={onSwitchToAdmin} onLogout={onLogout} />
    </PortalConfigProvider>
  );
}

function ResidentPortalInner({ onSwitchToAdmin, onLogout }: ResidentPortalProps) {
  const [route, setRoute] = useState<ResidentRoute>({ page: "home" });
  const themeColor = getPortalConfig().publicPortalSettings.portalThemeColor;
  const [profileOpen, setProfileOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [statusCertModalOpen, setStatusCertModalOpen] = useState(false);
  const [uploadInfoOpen, setUploadInfoOpen] = useState(false);
  const [rsvpsOpen, setRsvpsOpen] = useState(false);
  const [listRefresh, setListRefresh] = useState(0);

  const bumpList = () => setListRefresh((k) => k + 1);

  const navAction = getNavAction(route, themeColor, {
    onAddService: () => setServiceModalOpen(true),
    onAddIncident: () => setIncidentModalOpen(true),
    onAddSuggestion: () => setSuggestionModalOpen(true),
    onAddStatusCert: () => setStatusCertModalOpen(true),
    onUploadDocs: () => setUploadInfoOpen(true),
    onRsvps: () => setRsvpsOpen(true),
  });

  const fullWidth = route.page !== "home";

  return (
    <>
      <ResidentLayout
        route={route}
        onNavigate={setRoute}
        onSwitchToAdmin={onSwitchToAdmin}
        onOpenProfile={() => setProfileOpen(true)}
        onLogout={onLogout}
        navAction={navAction}
        fullWidth={fullWidth}
      >
        {renderPage(route, setRoute, listRefresh, {
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
          await residentRepo.createServiceRequest(input);
          bumpList();
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

      <Modal open={uploadInfoOpen} onClose={() => setUploadInfoOpen(false)} title="Upload Documents" size="md">
        <p className="text-sm text-slate-600">
          Document uploads are not available in this demo. In production, files would be uploaded to secure storage.
        </p>
      </Modal>

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
      return <HomePage onNavigate={onNavigate} />;
    case "news":
      return <NewsPage onNavigate={onNavigate} />;
    case "news-detail":
      return <NewsDetailPage id={route.id} />;
    case "documents":
      return <DocumentsPage />;
    case "service-requests":
      return <ServiceRequestsPage onAddNew={handlers.onAddService} refreshKey={refreshKey} />;
    case "incident-reports":
      return <IncidentReportsPage onAddNew={handlers.onAddIncident} refreshKey={refreshKey} />;
    case "newsletters":
      return <NewslettersPage onNavigate={onNavigate} />;
    case "newsletter-detail":
      return <NewsletterDetailPage id={route.id} onNavigate={onNavigate} />;
    case "suggestions":
      return <SuggestionsPage onAddNew={handlers.onAddSuggestion} refreshKey={refreshKey} />;
    case "events":
      return <EventsPage />;
    case "gallery":
      return <GalleryPage />;
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
