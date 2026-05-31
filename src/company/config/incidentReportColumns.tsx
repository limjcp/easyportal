import type { AdminTableColumn } from "../../admin/components/AdminPanelTable";
import { SeverityBadge, StatusBadge } from "../../admin/components/AdminBadges";
import { cn } from "../../utils/cn";
import type { MasterReportRow } from "../../resident/data/types";

function PendingReplyLabel({ value }: { value: MasterReportRow["pendingReplyLabel"] }) {
  if (value === "N/A") {
    return (
      <span className="inline-block rounded bg-slate-500 px-2 py-0.5 text-xs font-medium text-white">
        N/A
      </span>
    );
  }
  if (value === "Yes") {
    return (
      <span className="inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
        Yes
      </span>
    );
  }
  return (
    <span className="inline-block rounded bg-[#5cb85c] px-2 py-0.5 text-xs font-medium text-white">
      No
    </span>
  );
}

function truncateAddress(label: string, max = 22) {
  if (label.length <= max) return label;
  return `${label.slice(0, max)}…`;
}

export function getIncidentReportColumns(
  onView: (row: MasterReportRow) => void
): AdminTableColumn<MasterReportRow>[] {
  return [
    {
      key: "id",
      header: "ID",
      className: "text-center",
      render: (r) => (
        <div className={cn("text-center", r.unread && "font-semibold")}>
          {r.unread && (
            <span className="mb-1 block">
              <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-xs text-white">
                Unread
              </span>
            </span>
          )}
          {r.incidentNumber ?? r.id}
        </div>
      ),
      sortValue: (r) => r.incidentNumber ?? r.id,
    },
    {
      key: "address",
      header: "Address",
      className: "text-center",
      render: (r) => (
        <span
          className={cn(r.unread && "font-semibold")}
          title={r.buildingLabel}
        >
          {truncateAddress(r.buildingLabel)}
        </span>
      ),
      sortValue: (r) => r.buildingLabel,
    },
    {
      key: "incidentDate",
      header: "Incident Date",
      className: "text-center",
      render: (r) => <span className={cn(r.unread && "font-semibold")}>{r.date}</span>,
      sortValue: (r) => r.date,
    },
    {
      key: "unit",
      header: "Unit",
      className: "text-center",
      render: (r) => <span className={cn(r.unread && "font-semibold")}>{r.unit ?? ""}</span>,
      sortValue: (r) => r.unit ?? "",
      hideBelow: "md",
    },
    {
      key: "location",
      header: "Location",
      className: "text-center",
      render: (r) => (
        <span className={cn(r.unread && "font-semibold")}>{r.location ?? r.title}</span>
      ),
      sortValue: (r) => r.location ?? r.title,
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
    },
    {
      key: "pendingReply",
      header: "Pending Reply",
      className: "text-center",
      render: (r) => <PendingReplyLabel value={r.pendingReplyLabel ?? "No"} />,
      sortValue: (r) => r.pendingReplyLabel ?? "",
      hideBelow: "lg",
    },
    {
      key: "resolutionTime",
      header: "Resolution Time",
      className: "text-center",
      render: (r) => (
        <span className={cn(r.unread && "font-semibold")}>{r.resolutionTime ?? ""}</span>
      ),
      sortValue: (r) => r.resolutionTime ?? "",
      hideBelow: "md",
    },
    {
      key: "severity",
      header: "Severity",
      className: "text-center",
      render: (r) => (r.severity ? <SeverityBadge severity={r.severity} /> : "—"),
      sortValue: (r) => r.severity ?? "",
      hideBelow: "xl",
    },
    {
      key: "view",
      header: "",
      className: "text-center",
      render: (r) => (
        <button
          type="button"
          onClick={() => onView(r)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          View
        </button>
      ),
    },
  ];
}
