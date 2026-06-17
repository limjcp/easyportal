import type { AdminTableColumn } from "../../admin/components/AdminPanelTable";
import { SeverityBadge, StatusBadge } from "../../admin/components/AdminBadges";
import type { MasterReportRow, MasterReportType } from "../../resident/data/types";

function viewButton(onView: (row: MasterReportRow) => void) {
  return (r: MasterReportRow) => (
    <button
      type="button"
      onClick={() => onView(r)}
      className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-700"
    >
      View
    </button>
  );
}

export function getMasterReportColumns(
  reportType: MasterReportType,
  onView: (row: MasterReportRow) => void
): AdminTableColumn<MasterReportRow>[] {
  switch (reportType) {
    case "incident-reports":
    case "service-requests":
      return [
        { key: "id", header: "ID", render: (r) => r.id },
        { key: "building", header: "Community", render: (r) => r.buildingLabel, hideBelow: "lg" },
        { key: "date", header: "Date", render: (r) => r.date },
        {
          key: "severity",
          header: "Severity",
          render: (r) => (r.severity ? <SeverityBadge severity={r.severity as any} /> : "—"),
          hideBelow: "md",
        },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        {
          key: "pendingReply",
          header: "Pending Reply",
          render: (r) => ((r.pendingReply ?? false) ? "Yes" : "No"),
          hideBelow: "lg",
        },
        { key: "unit", header: "Owner", render: (r) => r.unit ?? "—", hideBelow: "lg" },
        { key: "title", header: "Description", render: (r) => r.title, className: "max-w-[24rem]" },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
    case "amenity-reservations":
      return [
        { key: "date", header: "Booked", render: (r) => r.date },
        { key: "building", header: "Community", render: (r) => r.buildingLabel },
        { key: "title", header: "Amenity", render: (r) => r.title, className: "max-w-[22rem]" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "unit", header: "Owner", render: (r) => r.unit ?? "—", hideBelow: "md" },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
    case "building-store":
      return [
        { key: "id", header: "ID", render: (r) => r.id },
        { key: "building", header: "Community", render: (r) => r.buildingLabel },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "date", header: "Date", render: (r) => r.date },
        { key: "title", header: "Items", render: (r) => r.title, className: "max-w-[20rem]" },
        { key: "extra", header: "Amount", render: (r) => r.extra ?? "—", hideBelow: "md" },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
    case "chargebacks":
      return [
        { key: "date", header: "Chargeback Date", render: (r) => r.date },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "building", header: "Community", render: (r) => r.buildingLabel },
        { key: "extra", header: "Total", render: (r) => r.extra ?? "—" },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
    case "users-pending":
      return [
        { key: "building", header: "Community", render: (r) => r.buildingLabel },
        { key: "title", header: "Name", render: (r) => r.title },
        { key: "extra", header: "Email", render: (r) => r.extra ?? "—", hideBelow: "md" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
    case "portal-signups":
      return [
        { key: "building", header: "Community", render: (r) => r.buildingLabel },
        { key: "title", header: "Name", render: (r) => r.title },
        { key: "unit", header: "Unit", render: (r) => r.unit ?? "—", hideBelow: "md" },
        { key: "extra", header: "Email", render: (r) => r.extra ?? "—", hideBelow: "lg" },
        {
          key: "residentType",
          header: "Resident type",
          render: (r) => r.residentType ?? "—",
          hideBelow: "md",
        },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "date", header: "Submitted", render: (r) => r.date, hideBelow: "lg" },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
    default:
      return [
        { key: "id", header: "ID", render: (r) => r.id },
        { key: "building", header: "Community", render: (r) => r.buildingLabel },
        { key: "date", header: "Date", render: (r) => r.date },
        { key: "title", header: "Title", render: (r) => r.title, className: "max-w-[22rem]" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "view", header: "", render: viewButton(onView), className: "text-right" },
      ];
  }
}

