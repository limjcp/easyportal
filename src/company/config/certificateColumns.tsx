import type { AdminTableColumn } from "../../admin/components/AdminPanelTable";
import { cn } from "../../utils/cn";
import type { MasterReportRow, MasterReportTab } from "../../resident/data/types";

function ProcessingLabel({ label }: { label: string }) {
  const rush =
    label.toLowerCase().includes("rush") || label.toLowerCase().includes("vip");
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium text-white",
        rush ? "bg-red-600" : "bg-[#337ab7]"
      )}
    >
      {label}
    </span>
  );
}

function CertificateStatusLabels({ status, statusExtra }: { status: string; statusExtra?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="inline-block rounded bg-[#5cb85c] px-2 py-0.5 text-xs font-medium text-white">
        {status}
      </span>
      {statusExtra && (
        <span className="inline-block rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-white">
          {statusExtra}
        </span>
      )}
    </div>
  );
}

function certificateViewButton(onView: (row: MasterReportRow) => void) {
  return (r: MasterReportRow) => (
    <button
      type="button"
      onClick={() => onView(r)}
      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
    >
      View
    </button>
  );
}

export function getCertificateColumns(
  tab: MasterReportTab,
  onView: (row: MasterReportRow) => void,
  options?: { singleBuilding?: boolean }
): AdminTableColumn<MasterReportRow>[] {
  const archived = tab === "archived";
  const singleBuilding = options?.singleBuilding ?? false;

  const base: AdminTableColumn<MasterReportRow>[] = [
    {
      key: "requestNumber",
      header: "#",
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
          {r.requestNumber ?? r.id}
        </div>
      ),
      sortValue: (r) => r.requestNumber ?? r.id,
    },
    {
      key: "processing",
      header: "Processing",
      className: "text-center",
      render: (r) => (r.processing ? <ProcessingLabel label={r.processing} /> : "—"),
      sortValue: (r) => r.processing ?? "",
    },
    {
      key: "purchaser",
      header: "Purchaser",
      className: "text-center",
      render: (r) => r.title,
      sortValue: (r) => r.title,
      hideBelow: archived ? undefined : "lg",
    },
  ];

  if (!archived && !singleBuilding) {
    base.push({
      key: "building",
      header: "Building",
      className: "text-center",
      render: (r) => r.buildingLabel,
      sortValue: (r) => r.buildingLabel,
    });
  }

  base.push(
    {
      key: "unit",
      header: "Unit",
      className: "text-center",
      render: (r) => r.unit ?? "—",
      sortValue: (r) => r.unit ?? "",
    },
    {
      key: "requested",
      header: "Requested",
      className: "text-center",
      render: (r) => r.date,
      sortValue: (r) => r.date,
    },
    {
      key: "due",
      header: "Due",
      className: "text-center",
      render: (r) => r.dueDate ?? "—",
      sortValue: (r) => r.dueDate ?? "",
    }
  );

  if (!archived) {
    base.push({
      key: "closing",
      header: "Closing Date",
      className: "text-center",
      render: (r) => r.closingDate || "",
      sortValue: (r) => r.closingDate ?? "",
      hideBelow: "md",
    });
  }

  base.push(
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (r) => <CertificateStatusLabels status={r.status} statusExtra={r.statusExtra} />,
      sortValue: (r) => r.status,
    },
    {
      key: "view",
      header: "",
      className: "text-center",
      render: certificateViewButton(onView),
    }
  );

  return base;
}
