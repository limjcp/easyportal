import type { MasterReportRow, MasterReportType } from "../../resident/data/types";

export type MasterReportFilterConfig = {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function uniqueOptions(rows: MasterReportRow[], key: (r: MasterReportRow) => string | undefined) {
  const values = Array.from(new Set(rows.map(key).filter(Boolean) as string[]));
  values.sort((a, b) => a.localeCompare(b));
  return values.map((v) => ({ value: v, label: v }));
}

export function getMasterReportFilters(args: {
  reportType: MasterReportType;
  rows: MasterReportRow[];
  buildings: { value: string; label: string }[];
  buildingId: string;
  onBuildingIdChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  severity: string;
  onSeverityChange: (value: string) => void;
  unit: string;
  onUnitChange: (value: string) => void;
  owner: string;
  onOwnerChange: (value: string) => void;
  pendingReply: string;
  onPendingReplyChange: (value: string) => void;
}): MasterReportFilterConfig[] {
  const base: MasterReportFilterConfig[] = [
    {
      id: "building",
      label: "Community",
      value: args.buildingId,
      options: args.buildings,
      onChange: args.onBuildingIdChange,
    },
  ];

  if (args.reportType === "incident-reports") {
    return [
      ...base,
      {
        id: "status",
        label: "Status",
        value: args.status,
        options: [
          { value: "all", label: "All" },
          { value: "Pending", label: "Pending" },
          { value: "Resolved", label: "Resolved" },
        ],
        onChange: args.onStatusChange,
      },
      {
        id: "severity",
        label: "Severity",
        value: args.severity,
        options: [
          { value: "all", label: "All" },
          { value: "High", label: "High" },
          { value: "Medium", label: "Medium" },
          { value: "Low", label: "Low" },
        ],
        onChange: args.onSeverityChange,
      },
      {
        id: "unit",
        label: "Owner",
        value: args.unit,
        options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.unit)],
        onChange: args.onUnitChange,
      },
      {
        id: "owner",
        label: "Owner Name",
        value: args.owner,
        options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.owner)],
        onChange: args.onOwnerChange,
      },
      {
        id: "pendingReply",
        label: "Pending Reply",
        value: args.pendingReply,
        options: [
          { value: "all", label: "All" },
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
        onChange: args.onPendingReplyChange,
      },
    ];
  }

  if (args.reportType === "service-requests") {
    return [
      ...base,
      {
        id: "status",
        label: "Status",
        value: args.status,
        options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.status)],
        onChange: args.onStatusChange,
      },
      {
        id: "severity",
        label: "Severity",
        value: args.severity,
        options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.severity)],
        onChange: args.onSeverityChange,
      },
      {
        id: "unit",
        label: "Owner",
        value: args.unit,
        options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.unit)],
        onChange: args.onUnitChange,
      },
      {
        id: "owner",
        label: "Owner Name",
        value: args.owner,
        options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.owner)],
        onChange: args.onOwnerChange,
      },
      {
        id: "pendingReply",
        label: "Pending Reply",
        value: args.pendingReply,
        options: [
          { value: "all", label: "All" },
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        onChange: args.onPendingReplyChange,
      },
    ];
  }

  if (args.reportType === "board-approvals") {
    return [
      ...base,
      {
        id: "status",
        label: "Status",
        value: args.status,
        options: [
          { value: "all", label: "View All" },
          { value: "Approved", label: "Approved" },
          { value: "Disapproved", label: "Disapproved" },
          { value: "Tie Vote", label: "Tie Vote" },
          { value: "Pending", label: "Pending" },
          { value: "No Votes Required", label: "No Votes Required" },
        ],
        onChange: args.onStatusChange,
      },
    ];
  }

  if (args.reportType === "users-pending" || args.reportType === "portal-signups") {
    return base;
  }

  return [
    ...base,
    {
      id: "status",
      label: "Status",
      value: args.status,
      options: [{ value: "all", label: "All" }, ...uniqueOptions(args.rows, (r) => r.status)],
      onChange: args.onStatusChange,
    },
  ];
}

