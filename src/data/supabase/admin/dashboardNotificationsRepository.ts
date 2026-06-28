import type { AdminRoute } from "../../../admin/navigation";
import { mapDbError, sb } from "../base";
import { bid } from "./shared";

export type AdminDashboardMessage = {
  id: string;
  moduleKey: string;
  count: number;
  label: string;
  color: string;
  route: AdminRoute;
};

/** Keys returned by `get_admin_dashboard_counts` RPC (snake_case). */
export type AdminDashboardCounts = {
  amenity_bookings: number;
  service_requests: number;
  status_certificates: number;
  incident_reports: number;
  board_applications: number;
  board_approvals: number;
  compliance_overdue: number;
  news_notices: number;
  consultation_leads: number;
  suggestions: number;
  chat_unread: number;
  units_users_pending: number;
};

type MessageDefinition = {
  id: string;
  moduleKey: string;
  label: string;
  color: string;
  route: AdminRoute;
  sortOrder: number;
  countKey: keyof AdminDashboardCounts;
};

const MESSAGE_DEFINITIONS: MessageDefinition[] = [
  {
    id: "amenity-bookings",
    moduleKey: "amenities",
    label: "Amenity Booking(s) Awaiting Approval",
    color: "bg-violet-600",
    route: { page: "amenity-bookings", tab: "current" },
    sortOrder: 10,
    countKey: "amenity_bookings",
  },
  {
    id: "service-requests",
    moduleKey: "service-requests",
    label: "Service Request(s) Needing Attention",
    color: "bg-orange-500",
    route: { page: "service-requests", tab: "current" },
    sortOrder: 20,
    countKey: "service_requests",
  },
  {
    id: "status-certificates",
    moduleKey: "status-certificates",
    label: "New Status Certificate Request(s)",
    color: "bg-purple-500",
    route: { page: "status-certificates", tab: "current" },
    sortOrder: 30,
    countKey: "status_certificates",
  },
  {
    id: "incident-reports",
    moduleKey: "incident-reports",
    label: "New Incident Report(s)",
    color: "bg-red-600",
    route: { page: "incident-reports", tab: "current" },
    sortOrder: 40,
    countKey: "incident_reports",
  },
  {
    id: "board-applications",
    moduleKey: "board-members",
    label: "New Board Member Application(s)",
    color: "bg-[#3476ef]",
    route: { page: "board-members", tab: "applications" },
    sortOrder: 50,
    countKey: "board_applications",
  },
  {
    id: "board-approvals",
    moduleKey: "board-approvals",
    label: "Board Approval(s) Pending Vote",
    color: "bg-slate-800",
    route: { page: "board-approvals", tab: "current" },
    sortOrder: 60,
    countKey: "board_approvals",
  },
  {
    id: "compliance-dashboard",
    moduleKey: "compliance-dashboard",
    label: "Overdue Compliance Item(s)",
    color: "bg-rose-700",
    route: { page: "compliance-dashboard" },
    sortOrder: 70,
    countKey: "compliance_overdue",
  },
  {
    id: "news-notices",
    moduleKey: "news-notices",
    label: "Unread News & Notice Item(s)",
    color: "bg-sky-600",
    route: { page: "news-notices", tab: "current" },
    sortOrder: 80,
    countKey: "news_notices",
  },
  {
    id: "consultation-leads",
    moduleKey: "consultation-leads",
    label: "New Consultation Lead(s)",
    color: "bg-emerald-600",
    route: { page: "consultation-leads" },
    sortOrder: 90,
    countKey: "consultation_leads",
  },
  {
    id: "suggestions",
    moduleKey: "suggestions",
    label: "New Suggestion(s)",
    color: "bg-lime-500",
    route: { page: "suggestions" },
    sortOrder: 100,
    countKey: "suggestions",
  },
  {
    id: "chat",
    moduleKey: "chat",
    label: "Unread Chat Conversation(s)",
    color: "bg-cyan-600",
    route: { page: "chat" },
    sortOrder: 110,
    countKey: "chat_unread",
  },
  {
    id: "units-users",
    moduleKey: "units-users",
    label: "User(s) Pending Assignment",
    color: "bg-[#f0ad4e]",
    route: { page: "units-users", tab: "pending" },
    sortOrder: 120,
    countKey: "units_users_pending",
  },
];

const EMPTY_COUNTS: AdminDashboardCounts = {
  amenity_bookings: 0,
  service_requests: 0,
  status_certificates: 0,
  incident_reports: 0,
  board_applications: 0,
  board_approvals: 0,
  compliance_overdue: 0,
  news_notices: 0,
  consultation_leads: 0,
  suggestions: 0,
  chat_unread: 0,
  units_users_pending: 0,
};

async function fetchDashboardCounts(buildingId: string): Promise<AdminDashboardCounts> {
  const { data, error } = await sb().rpc("get_admin_dashboard_counts", {
    p_building_id: buildingId,
  });
  mapDbError(error);
  return { ...EMPTY_COUNTS, ...(data as AdminDashboardCounts | null) };
}

export const dashboardNotificationsRepository = {
  async getDashboardMessages(): Promise<AdminDashboardMessage[]> {
    const buildingId = await bid();
    const counts = await fetchDashboardCounts(buildingId);

    return MESSAGE_DEFINITIONS.filter((definition) => counts[definition.countKey] > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((definition) => ({
        id: definition.id,
        moduleKey: definition.moduleKey,
        count: counts[definition.countKey],
        label: definition.label,
        color: definition.color,
        route: definition.route,
      }));
  },
};
